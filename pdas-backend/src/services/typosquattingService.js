/**
 * @module typosquattingService
 * @description Detects typosquatting attacks by comparing domain names against
 * trusted brands using Levenshtein distance. Handles common character
 * substitutions that attackers use to deceive users.
 */

/**
 * Trusted brand names that attackers commonly impersonate.
 * Includes global brands and Kenyan financial/government services.
 * @type {string[]}
 */
const trustedBrands = [
  // Global brands
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
  // Kenyan brands
  "safaricom",
  "mpesa",
  "equity",
  "kcb",
  "cooperative",
  "stanbic",
  "ncba",
  "absa",
  "kra",
  "nhif",
  "nssf",
];

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

<<<<<<< HEAD
/**
 * Checks whether a domain is a typosquat of a known trusted brand.
 * Strips the TLD, applies character substitution normalization (look-alike
 * chars only — hyphens and word segments are preserved), then compares the
 * full domain label and the base label (before the first hyphen) against
 * each trusted brand using Levenshtein distance.
 *
 * @param {string} domain - The domain to check (e.g., "paypa1.com")
 * @returns {{ isTyposquat: boolean, matchedBrand: string|null, editDistance: number|null, attackType: string|null }}
=======
const getBrandTokens = (value) => normalizeSubstitutions(value)
  .split(/[^a-z0-9]+/)
  .filter(Boolean);

const buildCandidates = (baseName) => {
  const labels = baseName.split(/[^a-z0-9]+/).filter(Boolean);
  const candidates = [{ raw: baseName, normalized: normalizeSubstitutions(baseName) }];

  labels.forEach((label) => {
    candidates.push({ raw: label, normalized: normalizeSubstitutions(label) });
  });

  return candidates;
};

/**
 * Checks whether a domain is a typosquat of a known trusted brand.
 * Strips the TLD, applies character substitution normalization, then
 * compares against each trusted brand using Levenshtein distance.
 * A distance of 1–2 (but not 0, which is an exact match) is flagged.
 *
 * @param {string} domain - The domain to check (e.g., "paypa1.com")
 * @returns {{ isTyposquat: boolean, matchedBrand: string|null, editDistance: number|null }}
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
 */
const checkTyposquatting = (domain) => {
  const safe = { isTyposquat: false, matchedBrand: null, editDistance: null, attackType: null };

  if (!domain || typeof domain !== "string") return safe;

<<<<<<< HEAD
  const withoutTld = extractBaseName(domain);
  if (!withoutTld) return safe;

  const baseDomain = withoutTld.split("-")[0];
  const candidates = [
    { str: normalizeSubstitutions(withoutTld), raw: withoutTld, label: "full" },
    { str: normalizeSubstitutions(baseDomain), raw: baseDomain, label: "base" },
  ];
=======
  const baseName = extractBaseName(domain);
  if (!baseName) return safe;

  const normalized = normalizeSubstitutions(baseName);
  const normalizedTokens = getBrandTokens(baseName);
  const candidates = buildCandidates(baseName);
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf

  let bestMatch = null;
  let bestDistance = Infinity;
  let attackType = null;

  for (const brand of trustedBrands) {
<<<<<<< HEAD
    for (const { str, raw, label } of candidates) {
      const distance = levenshteinDistance(str, brand);
      const rawDistance = levenshteinDistance(raw, brand);

      if (distance === 0 && label === "base" && raw !== brand) {
=======
    for (const candidate of candidates) {
      const normalizedDistance = levenshteinDistance(candidate.normalized, brand);
      const rawDistance = levenshteinDistance(candidate.raw, brand);

      if (normalizedDistance === 0 && candidate.raw !== brand) {
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
        return {
          isTyposquat: true,
          matchedBrand: brand,
          editDistance: rawDistance,
          attackType: "character_substitution",
        };
      }

<<<<<<< HEAD
      if (distance >= 1 && distance <= 2 && distance < bestDistance) {
        bestDistance = distance;
=======
      if (
        normalizedDistance >= 1 &&
        normalizedDistance <= 2 &&
        normalizedDistance < bestDistance
      ) {
        bestDistance = normalizedDistance;
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
        bestMatch = brand;
        attackType = "typosquatting";
      }
    }
<<<<<<< HEAD
=======

    if (normalizedTokens.includes(brand) && normalized !== brand && !bestMatch) {
      bestMatch = brand;
      bestDistance = levenshteinDistance(baseName, brand);
      attackType = "brand_impersonation";
    }

    // Check 1: Character substitution attack
    // The normalized form matches exactly, but the raw domain is different
    // e.g., "paypa1" normalizes to "paypal" (distance 0), but "paypa1" !== "paypal"
    if (normalized === brand && baseName !== brand) {
      return {
        isTyposquat: true,
        matchedBrand: brand,
        editDistance: 0,
        attackType: "character_substitution",
      };
    }

    // Check 2: Classic typosquatting (misspelling)
    // Distance 1–2 after normalization indicates a likely typosquat attempt
    const distance = levenshteinDistance(normalized, brand);
    if (distance >= 1 && distance <= 2 && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = brand;
      attackType = "typosquatting";
    }
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
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
