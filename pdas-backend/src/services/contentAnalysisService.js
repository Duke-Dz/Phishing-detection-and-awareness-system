const http = require("http");
const https = require("https");
const { URL } = require("url");
const dns = require("dns");
const net = require("net");
const { promisify } = require("util");

const dnsLookup = promisify(dns.lookup);

const REQUEST_TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 512 * 1024;

const SHORTENER_DOMAINS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly",
  "is.gd", "rb.gy", "shorturl.at", "cutt.ly", "tiny.cc",
]);

const KNOWN_BRANDS = [
  "paypal", "apple", "google", "microsoft", "amazon",
  "netflix", "facebook", "instagram", "twitter", "whatsapp",
  "chase", "wellsfargo", "citi", "bankofamerica", "hsbc",
  "dropbox", "linkedin", "yahoo", "outlook", "icloud",
];

const PRIVATE_HOSTNAMES = new Set(["localhost", "localhost.localdomain"]);

const isPrivateAddress = (address) => {
  if (!address || typeof address !== "string") return true;

  const normalized = address.toLowerCase();
  const ipVersion = net.isIP(normalized);

  if (ipVersion === 4) {
    const [a, b] = normalized.split(".").map((value) => Number.parseInt(value, 10));
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }

  if (ipVersion === 6) {
    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:") ||
      normalized.startsWith("::ffff:127.") ||
      normalized.startsWith("::ffff:10.") ||
      normalized.startsWith("::ffff:192.168.") ||
      /^::ffff:172\.(1[6-9]|2\d|3[01])\./.test(normalized)
    );
  }

  return false;
};

const isPrivateIp = async (hostname) => {
  if (!hostname || typeof hostname !== "string") return true;

  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (PRIVATE_HOSTNAMES.has(normalized)) return true;
  if (net.isIP(normalized)) return isPrivateAddress(normalized);

  try {
    const addresses = await dnsLookup(normalized, { all: true });
    return addresses.some(({ address }) => isPrivateAddress(address));
  } catch {
    return false;
  }
};

const clientForProtocol = (protocol) => (protocol === "https:" ? https : http);

const safeGet = (targetUrl) =>
  new Promise(async (resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return reject(new Error(`Invalid URL: ${targetUrl}`));
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return reject(new Error(`Unsupported URL protocol: ${parsed.protocol}`));
    }

    try {
      const blocked = await isPrivateIp(parsed.hostname);
      if (blocked) {
        return reject(new Error(`Blocked private IP: ${parsed.hostname}`));
      }
    } catch {
      return reject(new Error(`Could not verify host safety: ${parsed.hostname}`));
    }

    const req = clientForProtocol(parsed.protocol).get(targetUrl, { timeout: REQUEST_TIMEOUT_MS }, (res) => {
      resolve(res);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    req.on("error", (err) => {
      reject(err);
    });
  });

const readResponseBody = (res, maxBytes = MAX_HTML_BYTES) =>
  new Promise((resolve, reject) => {
    let totalBytes = 0;
    const chunks = [];
    let resolved = false;

    const finish = () => {
      if (resolved) return;
      resolved = true;
      resolve(Buffer.concat(chunks).toString("utf8"));
    };

    res.on("data", (chunk) => {
      if (resolved) return;
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        finish();
        res.destroy();
        return;
      }
      chunks.push(chunk);
    });

    res.on("end", finish);
    res.on("error", reject);
  });

const followRedirects = async (url, maxHops = 5) => {
  const chain = [];
  let currentUrl = url;
  let timedOut = false;
  let html = null;

  for (let i = 0; i < maxHops; i += 1) {
    try {
      const res = await safeGet(currentUrl);
      const statusCode = res.statusCode || 0;
      chain.push({ url: currentUrl, statusCode });

      const contentType = String(res.headers["content-type"] || "").toLowerCase();
      if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
        res.resume();
        currentUrl = new URL(res.headers.location, currentUrl).href;
      } else {
        if (contentType.includes("text/html")) {
          html = await readResponseBody(res);
        } else {
          res.resume();
        }
        break;
      }
    } catch (err) {
      if (err.message === "Request timed out") {
        timedOut = true;
      }
      chain.push({ url: currentUrl, statusCode: 0, error: err.message });
      break;
    }
  }

  return {
    chain,
    finalUrl: chain.length > 0 ? chain[chain.length - 1].url : url,
    hopCount: chain.length,
    timedOut,
    html,
  };
};

const extractDomain = (rawUrl) => {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};

const detectCredentialForms = (html, pageUrl) => {
  const details = [];
  const pageDomain = extractDomain(pageUrl);
  const formRegex = /<form[\s\S]*?<\/form>/gi;
  let match;

  while ((match = formRegex.exec(html)) !== null) {
    const form = match[0];
    const actionMatch = form.match(/action\s*=\s*["']([^"']+)["']/i);
    if (actionMatch) {
      const actionDomain = extractDomain(actionMatch[1]);
      if (actionDomain && actionDomain !== pageDomain) {
        details.push(`Form submits to external domain: ${actionDomain} (page: ${pageDomain})`);
      }
    }

    if (/type\s*=\s*["']password["']/i.test(form)) {
      details.push("Form contains a password input field");
    }

    if (
      /name\s*=\s*["'][^"']*(card|cc[-_]?num|credit)/i.test(form) ||
      /autocomplete\s*=\s*["']cc-number["']/i.test(form)
    ) {
      details.push("Form contains a credit card input field");
    }
  }

  return { found: details.length > 0, details };
};

const checkTitleDomainMismatch = (html, pageUrl) => {
  const details = [];
  const pageDomain = extractDomain(pageUrl);
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titleMatch) return { found: false, details };

  const titleText = titleMatch[1].toLowerCase().trim();
  for (const brand of KNOWN_BRANDS) {
    if (titleText.includes(brand) && !pageDomain.includes(brand)) {
      details.push(`Title references "${brand}" but domain is "${pageDomain}"`);
    }
  }

  return { found: details.length > 0, details };
};

const detectHiddenElements = (html) => {
  const details = [];
  const hiddenIframes = html.match(/<iframe[^>]*(?:hidden|display\s*:\s*none|width\s*=\s*["']0|height\s*=\s*["']0)[^>]*>/gi);
  if (hiddenIframes?.length > 0) {
    details.push(`Found ${hiddenIframes.length} suspicious hidden iframe(s)`);
  }

  const hiddenDivRegex = /<(?:div|span|section)[^>]*style\s*=\s*["'][^"']*display\s*:\s*none[^"']*["'][^>]*>[\s\S]*?<form[\s\S]*?<\/form>/gi;
  const hiddenForms = html.match(hiddenDivRegex);
  if (hiddenForms?.length > 0) {
    details.push(`Found ${hiddenForms.length} hidden element(s) containing forms`);
  }

  return { found: details.length > 0, details };
};

const analyzePageContent = (html, pageUrl) => {
  const safe = {
    hasCredentialHarvester: false,
    hasTitleMismatch: false,
    hasHiddenElements: false,
    details: [],
  };

  if (!html || typeof html !== "string" || !pageUrl || typeof pageUrl !== "string") {
    return safe;
  }

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

const expandShortUrl = async (url) => {
  const result = { isShortened: false, originalUrl: url, expandedUrl: null };
  if (!url || typeof url !== "string") return result;

  const domain = extractDomain(url);
  if (!SHORTENER_DOMAINS.has(domain)) return result;

  result.isShortened = true;
  try {
    const { finalUrl } = await followRedirects(url, 5);
    result.expandedUrl = finalUrl !== url ? finalUrl : null;
  } catch {
    // Leave expandedUrl null.
  }

  return result;
};

module.exports = {
  followRedirects,
  analyzePageContent,
  expandShortUrl,
  isPrivateIp,
};
