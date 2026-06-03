/**
 * @module urlTricksService
 * @description Detects common URL obfuscation tricks used in phishing attacks:
 * the @ symbol trick, subdomain impersonation, and excessive subdomain nesting.
 */

const { trustedBrands } = require("./typosquattingService");

/**
 * Known second-level domains that form compound TLDs.
 * Used by extractRegisteredDomain to correctly identify the registrable domain.
 * @type {string[]}
 */
const COMPOUND_SLDS = ["co.ke", "co.uk", "co.za", "com.au", "co.in", "ac.ke", "or.ke"];

/**
 * Safely parses a URL string into a URL object.
 * Prepends "https://" if no protocol is present to allow parsing.
 * @param {string} url - The URL string to parse
 * @returns {URL|null} The parsed URL object, or null if parsing fails
 */
const safeParse = (url) => {
  if (!url || typeof url !== "string") return null;

  try {
    // If the URL already has a protocol, parse directly
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url)) {
      return new URL(url);
    }
    // Otherwise, add a protocol so the URL constructor can parse it
    return new URL(`https://${url}`);
  } catch {
    return null;
  }
};

/**
 * Extracts the registered domain (eTLD+1) from a hostname.
 * Handles common compound second-level domains like .co.ke, .co.uk, etc.
 *
 * @param {string} hostname - The full hostname (e.g., "login.paypal.co.ke")
 * @returns {string} The registered domain (e.g., "paypal.co.ke"),
 *   or the hostname itself if it cannot be decomposed further
 *
 * @example
 * extractRegisteredDomain("sub.example.com")      // "example.com"
 * extractRegisteredDomain("a.b.paypal.co.ke")      // "paypal.co.ke"
 * extractRegisteredDomain("evil.com")               // "evil.com"
 */
const extractRegisteredDomain = (hostname) => {
  const host = String(hostname || "").toLowerCase().trim();
  if (!host) return "";

  const parts = host.split(".");
  if (parts.length <= 2) return host;

  // Check if the last two parts form a compound SLD (e.g., "co.ke")
  const lastTwo = parts.slice(-2).join(".");
  if (COMPOUND_SLDS.includes(lastTwo)) {
    // Registered domain = label + compound SLD (e.g., "paypal.co.ke")
    return parts.length >= 3 ? parts.slice(-3).join(".") : host;
  }

  // Standard TLD: registered domain is the last two labels
  return parts.slice(-2).join(".");
};

/**
 * Detects the @ symbol trick in URLs.
 * In a URL like `http://paypal.com@evil.com/login`, the browser ignores
 * "paypal.com" (treated as userinfo) and navigates to "evil.com".
 *
 * @param {string} url - The URL to inspect
 * @returns {{ detected: boolean, realDomain: string|null, fakeDomain: string|null }}
 *
 * @example
 * checkAtTrick("http://paypal.com@evil.com/login")
 * // { detected: true, realDomain: "evil.com", fakeDomain: "paypal.com" }
 */
const checkAtTrick = (url) => {
  const safe = { detected: false, realDomain: null, fakeDomain: null };

  if (!url || typeof url !== "string") return safe;

  const parsed = safeParse(url);
  if (!parsed) return safe;

  // The URL constructor separates userinfo from the hostname automatically.
  // If a username (or password) is present, the @ trick is in play.
  const username = parsed.username;
  const password = parsed.password;

  if (!username && !password) return safe;

  // The fake domain is what the user thinks they see (the userinfo part).
  // Reconstruct it from username:password if both exist.
  const fakeDomain = password ? `${username}:${password}` : username;
  const realDomain = parsed.hostname;

  return {
    detected: true,
    realDomain: realDomain || null,
    fakeDomain: fakeDomain ? decodeURIComponent(fakeDomain) : null,
  };
};

/**
 * Detects when a trusted brand name appears as a subdomain of an
 * unrelated domain. For example, "paypal.com.evil.xyz" uses "paypal"
 * in the subdomain to trick the user, but the actual domain is "evil.xyz".
 *
 * @param {string} url - The URL to inspect
 * @returns {{ detected: boolean, impersonatedBrand: string|null, actualDomain: string|null }}
 *
 * @example
 * checkSubdomainImpersonation("https://paypal.com.evil.xyz/login")
 * // { detected: true, impersonatedBrand: "paypal", actualDomain: "evil.xyz" }
 */
const checkSubdomainImpersonation = (url) => {
  const safe = { detected: false, impersonatedBrand: null, actualDomain: null };

  if (!url || typeof url !== "string") return safe;

  const parsed = safeParse(url);
  if (!parsed) return safe;

  const hostname = parsed.hostname.toLowerCase();
  const registeredDomain = extractRegisteredDomain(hostname);

  // Get the subdomain portion (everything before the registered domain)
  const subdomainPortion = hostname.slice(0, -(registeredDomain.length + 1));
  if (!subdomainPortion) return safe;

  const subdomainParts = subdomainPortion.split(".");

  // Check each subdomain label for trusted brand names
  for (const brand of trustedBrands) {
    for (const part of subdomainParts) {
      // Match if a subdomain label IS the brand or contains it
      if (part === brand || part.includes(brand)) {
        // Make sure the registered domain itself isn't the brand's real domain
        const registeredBase = registeredDomain.split(".")[0];
        if (registeredBase !== brand) {
          return {
            detected: true,
            impersonatedBrand: brand,
            actualDomain: registeredDomain,
          };
        }
      }
    }
  }

  return safe;
};

/**
 * Flags domains that use an excessive number of subdomains (4 or more levels).
 * Deep subdomain nesting like "a.b.c.d.evil.com" is a common obfuscation
 * technique to hide the real domain from casual inspection.
 *
 * @param {string} url - The URL to inspect
 * @returns {{ detected: boolean, subdomainCount: number }}
 *
 * @example
 * checkExcessiveSubdomains("https://a.b.c.d.evil.com")
 * // { detected: true, subdomainCount: 4 }
 */
const checkExcessiveSubdomains = (url) => {
  const safe = { detected: false, subdomainCount: 0 };

  if (!url || typeof url !== "string") return safe;

  const parsed = safeParse(url);
  if (!parsed) return safe;

  const hostname = parsed.hostname.toLowerCase();
  const registeredDomain = extractRegisteredDomain(hostname);

  // Calculate the subdomain portion
  if (hostname === registeredDomain) {
    return safe; // No subdomains at all
  }

  const subdomainPortion = hostname.slice(0, -(registeredDomain.length + 1));
  if (!subdomainPortion) return safe;

  const subdomainCount = subdomainPortion.split(".").filter(Boolean).length;

  return {
    detected: subdomainCount >= 4,
    subdomainCount,
  };
};

module.exports = {
  checkAtTrick,
  checkSubdomainImpersonation,
  checkExcessiveSubdomains,
};
