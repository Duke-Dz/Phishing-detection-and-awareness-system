/**
 * @module contentAnalysisService
 * @description Layer 4 — Heuristic content analysis.
 *
 * Provides utilities to follow HTTP redirects, expand shortened URLs,
 * and analyse fetched HTML pages for phishing indicators such as
 * credential-harvesting forms, title-domain mismatches and hidden elements.
 *
 * Uses Node.js built-in `http` / `https` modules (no external deps)
 * and blocks requests to private IP ranges (SSRF protection).
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const dns = require('dns');
const { promisify } = require('util');

const dnsLookup = promisify(dns.lookup);

// ───────────────────────── constants ─────────────────────────

/** Per-hop timeout in milliseconds. */
const REQUEST_TIMEOUT_MS = 5000;

/** Known URL shortener domains. */
const SHORTENER_DOMAINS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly',
  'is.gd', 'rb.gy', 'shorturl.at', 'cutt.ly', 'tiny.cc',
]);

/**
 * Well-known brand names used for title-mismatch detection.
 * Extend as needed.
 */
const KNOWN_BRANDS = [
  'paypal', 'apple', 'google', 'microsoft', 'amazon',
  'netflix', 'facebook', 'instagram', 'twitter', 'whatsapp',
  'chase', 'wellsfargo', 'citi', 'bankofamerica', 'hsbc',
  'dropbox', 'linkedin', 'yahoo', 'outlook', 'icloud',
];

/** Regex to match private / loopback IP ranges. */
const PRIVATE_IP_RE =
  /^(127\.\d{1,3}\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|0\.0\.0\.0)$/;

// ─────────────────── helper utilities ────────────────────────

/**
 * Check whether a hostname string is a private/loopback IP address.
 * Also resolves DNS names and checks the resolved address.
 *
 * @param {string} hostname
 * @returns {Promise<boolean>}
 */
const isPrivateIp = async (hostname) => {
  if (!hostname || typeof hostname !== 'string') return true;

  // Direct IP check
  if (PRIVATE_IP_RE.test(hostname)) return true;

  // DNS resolution check
  try {
    const { address } = await dnsLookup(hostname);
    return PRIVATE_IP_RE.test(address);
  } catch {
    // DNS failure → treat as potentially unsafe
    return false;
  }
};

/**
 * Return the appropriate http/https module for a given protocol string.
 * @param {string} protocol - e.g. 'https:'
 * @returns {typeof http | typeof https}
 */
const clientForProtocol = (protocol) =>
  protocol === 'https:' ? https : http;

/**
 * Perform a single GET request that resolves with the response object.
 * Applies timeout and SSRF protection.
 *
 * @param {string} targetUrl
 * @returns {Promise<import('http').IncomingMessage>}
 */
const safeGet = (targetUrl) =>
  new Promise(async (resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return reject(new Error(`Invalid URL: ${targetUrl}`));
    }

    // SSRF gate
    try {
      const blocked = await isPrivateIp(parsed.hostname);
      if (blocked) {
        return reject(new Error(`Blocked private IP: ${parsed.hostname}`));
      }
    } catch {
      // If the SSRF check itself fails, allow cautiously (DNS may be down)
    }

    const client = clientForProtocol(parsed.protocol);

    const req = client.get(targetUrl, { timeout: REQUEST_TIMEOUT_MS }, (res) => {
      resolve(res);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });

// ───────────────── redirect following ────────────────────────

/**
 * Follow HTTP 3xx redirects manually, recording each hop.
 *
 * @param {string} url      - Starting URL.
 * @param {number} [maxHops=5] - Maximum number of redirects to follow.
 * @returns {Promise<{
 *   chain: Array<{url: string, statusCode: number}>,
 *   finalUrl: string,
 *   hopCount: number,
 *   timedOut: boolean
 * }>}
 */
const followRedirects = async (url, maxHops = 5) => {
  const chain = [];
  let currentUrl = url;
  let timedOut = false;

  for (let i = 0; i < maxHops; i++) {
    try {
      const res = await safeGet(currentUrl);

      const statusCode = res.statusCode || 0;
      chain.push({ url: currentUrl, statusCode });

      // Consume the response body so the socket is freed
      res.resume();

      if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
        // Resolve relative redirects
        currentUrl = new URL(res.headers.location, currentUrl).href;
      } else {
        // Non-redirect response — we're done
        break;
      }
    } catch (err) {
      if (err.message === 'Request timed out') {
        timedOut = true;
      }
      // Record the hop that failed
      chain.push({ url: currentUrl, statusCode: 0 });
      break;
    }
  }

  const finalUrl = chain.length > 0 ? chain[chain.length - 1].url : url;

  return {
    chain,
    finalUrl,
    hopCount: chain.length,
    timedOut,
  };
};

// ─────────────── page content analysis ───────────────────────

/**
 * Extract the domain from a URL, stripping www prefix.
 * @param {string} rawUrl
 * @returns {string}
 */
const extractDomain = (rawUrl) => {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};

/**
 * Detect forms that harvest credentials (password / credit-card inputs)
 * or submit data to a different domain than the page itself.
 *
 * @param {string} html
 * @param {string} pageUrl
 * @returns {{ found: boolean, details: string[] }}
 */
const detectCredentialForms = (html, pageUrl) => {
  const details = [];
  const pageDomain = extractDomain(pageUrl);

  // Match <form ...>...</form> blocks (non-greedy, case-insensitive)
  const formRegex = /<form[\s\S]*?<\/form>/gi;
  let match;

  while ((match = formRegex.exec(html)) !== null) {
    const form = match[0];

    // Check for cross-domain action
    const actionMatch = form.match(/action\s*=\s*["']([^"']+)["']/i);
    if (actionMatch) {
      const actionDomain = extractDomain(actionMatch[1]);
      if (actionDomain && actionDomain !== pageDomain) {
        details.push(
          `Form submits to external domain: ${actionDomain} (page: ${pageDomain})`,
        );
      }
    }

    // Check for password inputs
    if (/type\s*=\s*["']password["']/i.test(form)) {
      details.push('Form contains a password input field');
    }

    // Check for credit card inputs (common name/autocomplete attributes)
    if (/name\s*=\s*["'][^"']*(card|cc[-_]?num|credit)/i.test(form) ||
        /autocomplete\s*=\s*["']cc-number["']/i.test(form)) {
      details.push('Form contains a credit card input field');
    }
  }

  return { found: details.length > 0, details };
};

/**
 * Check if the page <title> references a well-known brand that does
 * not match the actual page domain.
 *
 * @param {string} html
 * @param {string} pageUrl
 * @returns {{ found: boolean, details: string[] }}
 */
const checkTitleDomainMismatch = (html, pageUrl) => {
  const details = [];
  const pageDomain = extractDomain(pageUrl);

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titleMatch) return { found: false, details };

  const titleText = titleMatch[1].toLowerCase().trim();

  for (const brand of KNOWN_BRANDS) {
    if (titleText.includes(brand) && !pageDomain.includes(brand)) {
      details.push(
        `Title references "${brand}" but domain is "${pageDomain}"`,
      );
    }
  }

  return { found: details.length > 0, details };
};

/**
 * Look for hidden iframes or elements with display:none that contain forms.
 *
 * @param {string} html
 * @returns {{ found: boolean, details: string[] }}
 */
const detectHiddenElements = (html) => {
  const details = [];

  // Hidden iframes
  const hiddenIframes = html.match(/<iframe[^>]*(?:hidden|display\s*:\s*none|width\s*=\s*["']0|height\s*=\s*["']0)[^>]*>/gi);
  if (hiddenIframes && hiddenIframes.length > 0) {
    details.push(`Found ${hiddenIframes.length} suspicious hidden iframe(s)`);
  }

  // Elements with display:none that wrap forms
  const hiddenDivRegex = /<(?:div|span|section)[^>]*style\s*=\s*["'][^"']*display\s*:\s*none[^"']*["'][^>]*>[\s\S]*?<form[\s\S]*?<\/form>/gi;
  const hiddenForms = html.match(hiddenDivRegex);
  if (hiddenForms && hiddenForms.length > 0) {
    details.push(`Found ${hiddenForms.length} hidden element(s) containing forms`);
  }

  return { found: details.length > 0, details };
};

/**
 * Analyse fetched HTML for phishing indicators.
 *
 * @param {string} html    - Raw HTML string.
 * @param {string} pageUrl - The URL the HTML was fetched from.
 * @returns {{
 *   hasCredentialHarvester: boolean,
 *   hasTitleMismatch: boolean,
 *   hasHiddenElements: boolean,
 *   details: string[]
 * }}
 */
const analyzePageContent = (html, pageUrl) => {
  const safe = {
    hasCredentialHarvester: false,
    hasTitleMismatch: false,
    hasHiddenElements: false,
    details: [],
  };

  if (!html || typeof html !== 'string') return safe;
  if (!pageUrl || typeof pageUrl !== 'string') return safe;

  try {
    const cred = detectCredentialForms(html, pageUrl);
    const title = checkTitleDomainMismatch(html, pageUrl);
    const hidden = detectHiddenElements(html);

    return {
      hasCredentialHarvester: cred.found,
      hasTitleMismatch: title.found,
      hasHiddenElements: hidden.found,
      details: [...cred.details, ...title.details, ...hidden.details],
    };
  } catch {
    return safe;
  }
};

// ──────────────── short URL expansion ────────────────────────

/**
 * If the URL belongs to a known shortener, follow redirects to
 * discover the final destination.
 *
 * @param {string} url
 * @returns {Promise<{
 *   isShortened: boolean,
 *   originalUrl: string,
 *   expandedUrl: string|null
 * }>}
 */
const expandShortUrl = async (url) => {
  const result = { isShortened: false, originalUrl: url, expandedUrl: null };

  if (!url || typeof url !== 'string') return result;

  const domain = extractDomain(url);
  if (!SHORTENER_DOMAINS.has(domain)) return result;

  result.isShortened = true;

  try {
    const { finalUrl } = await followRedirects(url, 5);
    result.expandedUrl = finalUrl !== url ? finalUrl : null;
  } catch {
    // Expansion failed — leave expandedUrl as null
  }

  return result;
};

// ─────────────────────── exports ─────────────────────────────

module.exports = {
  followRedirects,
  analyzePageContent,
  expandShortUrl,
  isPrivateIp,
};
