/**
 * @module typosquattingService
 * @description Detects typosquatting attacks by comparing domain names against
 * trusted brands using Levenshtein distance. Handles common character
 * substitutions that attackers use to deceive users.
 */

/**
 * Global brand names that attackers commonly impersonate.
 * @type {string[]}
 */
const trustedBrands = [
  "paypal",
  "google",
  "amazon",
  "microsoft",
  "apple",
  "netflix",
  "facebook",
  "instagram",
  "twitter",
  "linkedin",
  "whatsapp",
  "dropbox",
  "yahoo",
  "chase",
  "wellsfargo",
  "citibank",
  "youtube",
  "tesla",
];

const knownLegitimateBrandDomains = new Set([
  "amzn.to",
  "fb.me",
  "goo.gl",
  "wa.me",
  "youtu.be",
]);

/**
 * Character substitution map for attacker tricks.
 * Maps visually similar characters to their intended letter.
 * @type {Object<string, string>}
 */
const substitutionMap = {
  "0": "o",
  "1": "l",
  "3": "e",
  "4": "a",
  "5": "s",
  "8": "b",
  "@": "a",
  "$": "s",
};

/**
 * Computes the Levenshtein (minimum edit) distance between two strings
 * using standard dynamic programming.
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} The minimum number of single-character edits
 *   (insertions, deletions, substitutions) to transform a into b
 */
const levenshteinDistance = (a, b) => {
  const strA = String(a || "");
  const strB = String(b || "");

  const m = strA.length;
  const n = strB.length;

  // Edge cases: one or both strings are empty
  if (m === 0) return n;
  if (n === 0) return m;

  // Build a (m+1) x (n+1) DP matrix
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  // Base cases
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = strA[i - 1] === strB[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // deletion
        dp[i][j - 1] + 1,       // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
};

/**
 * Normalizes common character substitutions that attackers use.
 * For example, "paypa1" becomes "paypal", "g00gle" becomes "google".
 * @param {string} str - The string to normalize
 * @returns {string} The normalized string with substitutions applied
 */
const normalizeSubstitutions = (str) => {
  const input = String(str || "").toLowerCase();
  let normalized = "";

  for (const char of input) {
    normalized += substitutionMap[char] || char;
  }

  return normalized;
};

/**
 * Extracts the base name from a domain by stripping the TLD.
 * Handles multi-part TLDs like .co.ke, .co.uk, etc.
 * @param {string} domain - The full domain (e.g., "paypa1.com")
 * @returns {string} The base name without TLD (e.g., "paypa1")
 */
const extractBaseName = (domain) => {
  const clean = String(domain || "").toLowerCase().trim();
  if (!clean) return "";

  const parts = clean.split(".");
  if (parts.length <= 1) return clean;

  // Known second-level domains that form compound TLDs
  const compoundSlds = ["co.ke", "co.uk", "co.za", "com.au", "co.in", "ac.ke", "or.ke"];
  const lastTwo = parts.slice(-2).join(".");

  if (compoundSlds.includes(lastTwo) && parts.length > 2) {
    // Domain like "paypal.co.ke" → base is everything before the compound TLD
    return parts.slice(0, -2).join(".");
  }

  // Standard TLD like ".com", ".org" → base is everything before the last part
  return parts.slice(0, -1).join(".");
};

const url = require("url");

/**
 * Checks whether a domain is a typosquat of a known trusted brand.
 * Strips the TLD, applies character substitution normalization (look-alike
 * chars only — hyphens and word segments are preserved), then compares the
 * full domain label and the base label (before the first hyphen) against
 * each trusted brand using Levenshtein distance.
 *
 * @param {string} domain - The domain to check (e.g., "paypa1.com")
 * @returns {{ isTyposquat: boolean, matchedBrand: string|null, editDistance: number|null, attackType: string|null }}
 */
const checkTyposquatting = (domain) => {
  const safe = { isTyposquat: false, matchedBrand: null, editDistance: null, attackType: null };

  if (!domain || typeof domain !== "string") return safe;
  if (knownLegitimateBrandDomains.has(domain.toLowerCase().replace(/^www\./, ""))) return safe;

  // Decode Punycode to Unicode (e.g., xn--pypal-4ve.com -> pаypal.com)
  // This exposes homograph attacks to the Levenshtein distance check.
  const decodedDomain = url.domainToUnicode(domain);

  const withoutTld = extractBaseName(decodedDomain);
  if (!withoutTld) return safe;

  const baseDomain = withoutTld.split("-")[0];
  const candidates = [
    { str: normalizeSubstitutions(withoutTld), raw: withoutTld, label: "full" },
    { str: normalizeSubstitutions(baseDomain), raw: baseDomain, label: "base" },
  ];

  let bestMatch = null;
  let bestDistance = Infinity;
  let attackType = null;

  for (const brand of trustedBrands) {
    for (const { str, raw, label } of candidates) {
      const distance = levenshteinDistance(str, brand);
      const rawDistance = levenshteinDistance(raw, brand);

      if (distance === 0 && label === "base" && withoutTld !== brand) {
        return {
          isTyposquat: true,
          matchedBrand: brand,
          editDistance: rawDistance,
          attackType: raw !== brand ? "character_substitution" : "brand_impersonation_hyphenated",
        };
      }

      if (distance >= 1 && distance <= 2 && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = brand;
        attackType = "typosquatting";
      }
    }
  }

  if (bestMatch) {
    return {
      isTyposquat: true,
      matchedBrand: bestMatch,
      editDistance: bestDistance,
      attackType,
    };
  }

  return safe;
};

module.exports = { levenshteinDistance, checkTyposquatting, trustedBrands };
