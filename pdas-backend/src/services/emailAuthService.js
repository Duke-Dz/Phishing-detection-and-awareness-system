/**
 * @module emailAuthService
 * @description Email authentication & spoofing detection utilities.
 *
 * Provides helpers that inspect raw email headers and HTML content to
 * surface phishing signals such as failed SPF/DKIM/DMARC, display-name
 * spoofing, and embedded link mismatches.
 */

'use strict';

const { kenyanBrands } = require('../data/kenyanPatterns');

// ──────────────────────────────────────────────
//  Trusted / known brands list
// ──────────────────────────────────────────────

/**
 * Merged brand reference used for display-name spoofing checks.
 * Each entry maps a canonical brand name to its known domain stems.
 *
 * We reuse the kenyanBrands keywords and supplement with global brands.
 * @type {Array<{ name: string, keywords: string[] }>}
 */
const trustedBrands = [
  ...kenyanBrands,
  // Global brands commonly impersonated worldwide
  { name: 'PayPal', keywords: ['paypal'] },
  { name: 'Apple', keywords: ['apple', 'icloud'] },
  { name: 'Microsoft', keywords: ['microsoft', 'outlook', 'office365'] },
  { name: 'Google', keywords: ['google', 'gmail'] },
  { name: 'Amazon', keywords: ['amazon', 'aws'] },
  { name: 'Netflix', keywords: ['netflix'] },
  { name: 'Facebook', keywords: ['facebook', 'meta'] },
  { name: 'DHL', keywords: ['dhl'] },
  { name: 'FedEx', keywords: ['fedex'] },
  { name: 'WhatsApp', keywords: ['whatsapp'] },
];

// ──────────────────────────────────────────────
//  1. parseAuthenticationResults
// ──────────────────────────────────────────────

/**
 * @typedef {'pass'|'fail'|'softfail'|'none'|'missing'} AuthVerdict
 */

/**
 * Parse raw email header text and extract SPF, DKIM and DMARC verdicts.
 *
 * The function searches for well-known result tokens such as `spf=pass`
 * or `dmarc=fail`. It also inspects `Authentication-Results:` header
 * lines for structured verdicts.
 *
 * @param {string} headerText — Raw email header block
 * @returns {{ spf: AuthVerdict, dkim: AuthVerdict, dmarc: AuthVerdict }}
 */
const parseAuthenticationResults = (headerText) => {
  /** @type {{ spf: AuthVerdict, dkim: AuthVerdict, dmarc: AuthVerdict }} */
  const result = {
    spf: 'missing',
    dkim: 'missing',
    dmarc: 'missing',
  };

  if (!headerText || typeof headerText !== 'string') {
    return result;
  }

  const lower = headerText.toLowerCase();

  // Accepted verdict values per protocol
  const spfVerdicts = ['pass', 'fail', 'softfail', 'none'];
  const dkimVerdicts = ['pass', 'fail', 'none'];
  const dmarcVerdicts = ['pass', 'fail', 'none'];

  /**
   * Search for `protocol=verdict` in the text and return the first
   * recognised verdict, or 'missing' if nothing is found.
   *
   * @param {string} protocol
   * @param {string[]} allowed
   * @returns {AuthVerdict}
   */
  const extract = (protocol, allowed) => {
    // Match patterns like `spf=pass`, `dkim=fail`, etc.
    const regex = new RegExp(`${protocol}\\s*=\\s*(\\w+)`, 'gi');
    let match;
    while ((match = regex.exec(lower)) !== null) {
      const verdict = match[1].toLowerCase();
      if (allowed.includes(verdict)) {
        return /** @type {AuthVerdict} */ (verdict);
      }
    }
    return 'missing';
  };

  result.spf = extract('spf', spfVerdicts);
  result.dkim = extract('dkim', dkimVerdicts);
  result.dmarc = extract('dmarc', dmarcVerdicts);

  return result;
};

// ──────────────────────────────────────────────
//  2. checkDisplayNameSpoofing
// ──────────────────────────────────────────────

/**
 * @typedef {Object} SpoofResult
 * @property {boolean}      isSpoofed    — `true` when the display name claims a brand the domain doesn't own
 * @property {string}       displayName  — Extracted display name (empty string if absent)
 * @property {string}       actualDomain — Domain portion of the email address
 * @property {string|null}  claimedBrand — Brand name detected in the display name, or `null`
 */

/**
 * Detect display-name spoofing in a From header.
 *
 * A From header such as `"PayPal Support" <security@paypa1-mail.ru>` is
 * suspicious because the display name references PayPal but the actual
 * sending domain (`paypa1-mail.ru`) does not belong to PayPal.
 *
 * @param {string} fromHeader — Full From header value
 * @returns {SpoofResult}
 */
const checkDisplayNameSpoofing = (fromHeader) => {
  const safe = { isSpoofed: false, displayName: '', actualDomain: '', claimedBrand: null };

  if (!fromHeader || typeof fromHeader !== 'string') {
    return safe;
  }

  // ── Extract display name and email address ──
  //  Patterns handled:
  //    "Display Name" <email@domain.com>
  //    Display Name <email@domain.com>
  //    email@domain.com  (no display name)
  let displayName = '';
  let emailAddress = '';

  const angleMatch = fromHeader.match(/^(.*?)\s*<([^>]+)>/);
  if (angleMatch) {
    displayName = angleMatch[1].replace(/^["']+|["']+$/g, '').trim();
    emailAddress = angleMatch[2].trim();
  } else {
    // Bare email address
    emailAddress = fromHeader.trim();
  }

  // Extract domain from email address
  const atIndex = emailAddress.lastIndexOf('@');
  const actualDomain = atIndex !== -1 ? emailAddress.slice(atIndex + 1).toLowerCase() : '';

  if (!displayName || !actualDomain) {
    return { ...safe, displayName, actualDomain };
  }

  // ── Look for a brand match in the display name ──
  const lowerDisplay = displayName.toLowerCase();
  let claimedBrand = null;

  for (const brand of trustedBrands) {
    const mentioned = brand.keywords.some((kw) => lowerDisplay.includes(kw));
    if (mentioned) {
      claimedBrand = brand.name;
      break;
    }
  }

  if (!claimedBrand) {
    return { isSpoofed: false, displayName, actualDomain, claimedBrand: null };
  }

  // ── Check if the actual domain matches the claimed brand ──
  const matchingBrand = trustedBrands.find((b) => b.name === claimedBrand);
  const domainMatchesBrand = matchingBrand
    ? matchingBrand.keywords.some((kw) => actualDomain.includes(kw))
    : false;

  return {
    isSpoofed: !domainMatchesBrand,
    displayName,
    actualDomain,
    claimedBrand,
  };
};

// ──────────────────────────────────────────────
//  3. checkEmbeddedLinkMismatch
// ──────────────────────────────────────────────

/**
 * @typedef {Object} LinkMismatch
 * @property {string} displayText — Visible anchor text
 * @property {string} actualUrl   — URL the link actually points to
 */

/**
 * Scan HTML content for `<a>` tags where the visible text contains a domain
 * that differs from the domain in the `href`.
 *
 * Example of a mismatch:
 * ```html
 * <a href="http://evil.com/steal">paypal.com/account</a>
 * ```
 *
 * @param {string} content — Raw HTML string
 * @returns {{ hasMismatch: boolean, mismatches: LinkMismatch[] }}
 */
const checkEmbeddedLinkMismatch = (content) => {
  const safe = { hasMismatch: false, mismatches: [] };

  if (!content || typeof content !== 'string') {
    return safe;
  }

  // Regex to capture <a href="...">...</a> (including multiline)
  const anchorRegex = /<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  // Regex to spot a domain-like string inside the display text
  const domainLikeRegex = /([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}/gi;

  const mismatches = [];
  let match;

  while ((match = anchorRegex.exec(content)) !== null) {
    const hrefUrl = match[1];
    const displayText = match[2].replace(/<[^>]*>/g, '').trim(); // strip nested tags

    if (!displayText) continue;

    // Extract domain from href
    let hrefDomain = '';
    try {
      hrefDomain = new URL(hrefUrl).hostname.replace(/^www\./, '').toLowerCase();
    } catch (_e) {
      // If the href isn't a valid URL, skip
      continue;
    }

    // Look for domain-like text in the visible text
    const displayDomains = displayText.match(domainLikeRegex);
    if (!displayDomains) continue;

    for (const dd of displayDomains) {
      const cleanDisplayDomain = dd.replace(/^www\./, '').toLowerCase();
      if (cleanDisplayDomain !== hrefDomain && hrefDomain !== '') {
        mismatches.push({
          displayText: displayText.slice(0, 200),
          actualUrl: hrefUrl,
        });
        break; // one mismatch per anchor is enough
      }
    }
  }

  return {
    hasMismatch: mismatches.length > 0,
    mismatches,
  };
};

// ──────────────────────────────────────────────
//  Exports
// ──────────────────────────────────────────────

module.exports = {
  parseAuthenticationResults,
  checkDisplayNameSpoofing,
  checkEmbeddedLinkMismatch,
};
