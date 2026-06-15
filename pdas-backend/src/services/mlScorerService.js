/**
 * @module mlScorerService
 * @description Layer 3 feature-based scoring engine.
 *
 * Extracts numeric features from URLs and message text, then applies
 * pre-trained threshold weights (mimicking Random Forest classification)
 * to produce a 0–100 phishing risk score.
 */

// ───────────────────────── constants ─────────────────────────

const URGENCY_WORDS = [
  'immediately', 'urgent', 'now', 'today', 'expires',
  'hurry', 'fast', 'quickly', 'limited', 'deadline',
];

const SENSITIVE_WORDS = [
  'password', 'pin', 'otp', 'ssn', 'credit card',
  'bank account', 'login', 'credential', 'verify',
];

const URL_CREDENTIAL_WORDS = [
  'login', 'verify', 'password', 'account', 'secure',
  'update', 'confirm', 'credential', 'signin', 'auth',
];

const SUSPICIOUS_PATTERNS = [
  /click\s+here/i,
  /act\s+now/i,
  /dear\s+customer/i,
  /dear\s+user/i,
  /congratulations/i,
];

const IP_ADDRESS_RE = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

/** Weights derived from common phishing URL characteristics. */
const URL_WEIGHTS = {
  urlLength:      { threshold: 75,  weight: 8,  direction: 'above' },
  domainLength:   { threshold: 15,  weight: 10, direction: 'above' },
  domainDotCount: { threshold: 3,   weight: 12, direction: 'above' },
  hyphenCount:    { threshold: 1,   weight: 10, direction: 'above_eq' },
  specialCharCount: { threshold: 1, weight: 8,  direction: 'above' },
  digitCount:     { threshold: 1,   weight: 20, direction: 'above_eq' },
  digitRatio:     { threshold: 0.3, weight: 15, direction: 'above' },
  pathLength:     { threshold: 15,  weight: 15, direction: 'above' },
  pathSegments:   { threshold: 2,   weight: 10, direction: 'above_eq' },
  credentialPathKeywordCount: { threshold: 2, weight: 20, direction: 'above_eq' },
  hasHttps:       { threshold: 0,   weight: 25, direction: 'equals' },
  hasAtSymbol:    { threshold: 1,   weight: 15, direction: 'equals' },
  hasIpAddress:   { threshold: 1,   weight: 18, direction: 'equals' },
  subdomainCount: { threshold: 3,   weight: 8,  direction: 'above' },
};

/** Weights for message-level phishing indicators. */
const MSG_WEIGHTS = {
  urlCount:               { threshold: 1,    weight: 15, direction: 'above_eq' },
  urgencyWordCount:       { threshold: 2,    weight: 20, direction: 'above_eq' },
  sensitiveWordCount:     { threshold: 3,    weight: 20, direction: 'above_eq' },
  exclamationCount:       { threshold: 3,    weight: 8,  direction: 'above' },
  capsRatio:              { threshold: 0.08, weight: 10, direction: 'above' },
  suspiciousPatternCount: { threshold: 1,    weight: 15, direction: 'above_eq' },
  allCapsWordCount:       { threshold: 1,    weight: 10, direction: 'above_eq' },
  hasHttpOnly:            { threshold: 1,    weight: 20, direction: 'equals' },
  hasSuspiciousDomain:    { threshold: 1,    weight: 15, direction: 'equals' },
  claimsCompromised:      { threshold: 1,    weight: 25, direction: 'equals' },
  claimsPrize:            { threshold: 1,    weight: 20, direction: 'equals' },
  mentionsDeadline:       { threshold: 1,    weight: 10, direction: 'equals' },
  hasBankKeywordWithUrl:  { threshold: 1,    weight: 15, direction: 'equals' },
};

// ───────────────────── helper utilities ──────────────────────

/**
 * Safely parse a URL string. Returns null on failure.
 * @param {string} raw
 * @returns {URL|null}
 */
const safeParse = (raw) => {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
};

/**
 * Count non-overlapping occurrences of a substring (case-insensitive).
 * @param {string} haystack
 * @param {string} needle
 * @returns {number}
 */
const countSubstring = (haystack, needle) => {
  const lower = haystack.toLowerCase();
  const target = needle.toLowerCase();
  let count = 0;
  let pos = 0;
  while ((pos = lower.indexOf(target, pos)) !== -1) {
    count++;
    pos += target.length;
  }
  return count;
};

// ──────────────── URL feature extraction ─────────────────────

/**
 * Extract numeric features from a URL string.
 *
 * @param {string} url - The raw URL to analyse.
 * @returns {{
 *   urlLength: number,
 *   domainLength: number,
 *   dotCount: number,
 *   domainDotCount: number,
 *   hyphenCount: number,
 *   specialCharCount: number,
 *   digitCount: number,
 *   digitRatio: number,
 *   pathLength: number,
 *   pathSegments: number,
 *   hasHttps: number,
 *   hasAtSymbol: number,
 *   hasIpAddress: number,
 *   subdomainCount: number,
 *   queryParamCount: number,
 *   credentialPathKeywordCount: number
 * }}
 */
const extractUrlFeatures = (url) => {
  const defaults = {
    urlLength: 0,
    domainLength: 0,
    dotCount: 0,
    domainDotCount: 0,
    hyphenCount: 0,
    specialCharCount: 0,
    digitCount: 0,
    digitRatio: 0,
    pathLength: 0,
    pathSegments: 0,
    hasHttps: 0,
    hasAtSymbol: 0,
    hasIpAddress: 0,
    subdomainCount: 0,
    queryParamCount: 0,
    credentialPathKeywordCount: 0,
  };

  if (!url || typeof url !== 'string') return defaults;

  const parsed = safeParse(url);
  if (!parsed) return defaults;

  const domain = parsed.hostname.toLowerCase();
  const path = parsed.pathname || '';

  // Character-level counts
  const urlStr = url;
  const dotCount = (urlStr.match(/\./g) || []).length;
  const domainDotCount = (domain.match(/\./g) || []).length;
  const hyphenCount = (domain.match(/-/g) || []).length;
  const specialCharCount = (urlStr.match(/[@%=~!]/g) || []).length;
  const domainDigits = (domain.match(/\d/g) || []);
  const digitCount = domainDigits.length;
  const digitRatio = domain.length > 0
    ? parseFloat((digitCount / domain.length).toFixed(4))
    : 0;

  // Path analysis
  const pathSegments = path.split('/').filter((s) => s.length > 0).length;
  const credentialPathKeywordCount = URL_CREDENTIAL_WORDS.reduce(
    (total, word) => total + countSubstring(path, word),
    0,
  );

  // Protocol / special markers
  const hasHttps = parsed.protocol === 'https:' ? 1 : 0;
  const hasAtSymbol = urlStr.includes('@') ? 1 : 0;
  const hasIpAddress = IP_ADDRESS_RE.test(domain) ? 1 : 0;

  // Subdomain count — strip TLD + SLD, count remaining labels
  const domainParts = domain.split('.');
  const subdomainCount = domainParts.length > 2 ? domainParts.length - 2 : 0;

  // Query parameters
  const queryParamCount = Array.from(parsed.searchParams.keys()).length;

  return {
    urlLength: urlStr.length,
    domainLength: domain.length,
    dotCount,
    domainDotCount,
    hyphenCount,
    specialCharCount,
    digitCount,
    digitRatio,
    pathLength: path.length,
    pathSegments,
    hasHttps,
    hasAtSymbol,
    hasIpAddress,
    subdomainCount,
    queryParamCount,
    credentialPathKeywordCount,
  };
};

// ──────────────── message feature extraction ─────────────────

/**
 * Extract numeric features from a message body.
 *
 * @param {string} text - The raw message text.
 * @returns {{
 *   textLength: number,
 *   wordCount: number,
 *   urlCount: number,
 *   urgencyWordCount: number,
 *   sensitiveWordCount: number,
 *   exclamationCount: number,
 *   capsRatio: number,
 *   suspiciousPatternCount: number
 * }}
 */
const extractMessageFeatures = (text) => {
  const defaults = {
    textLength: 0,
    wordCount: 0,
    urlCount: 0,
    urgencyWordCount: 0,
    sensitiveWordCount: 0,
    exclamationCount: 0,
    capsRatio: 0,
    suspiciousPatternCount: 0,
    allCapsWordCount: 0,
    hasHttpOnly: 0,
    hasSuspiciousDomain: 0,
    claimsCompromised: 0,
    claimsPrize: 0,
    mentionsDeadline: 0,
    hasBankKeywordWithUrl: 0,
  };

  if (!text || typeof text !== 'string') return defaults;

  const textLength = text.length;
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;

  // URLs in body
  const urlMatches = text.match(/https?:\/\/[^\s]+/gi) || [];
  const urlCount = urlMatches.length;

  // Keyword scanning (case-insensitive)
  const lowerText = text.toLowerCase();
  let urgencyWordCount = 0;
  for (const word of URGENCY_WORDS) {
    urgencyWordCount += countSubstring(lowerText, word);
  }

  let sensitiveWordCount = 0;
  for (const word of SENSITIVE_WORDS) {
    sensitiveWordCount += countSubstring(lowerText, word);
  }

  // Punctuation / casing
  const exclamationCount = (text.match(/!/g) || []).length;

  const letters = text.replace(/[^a-zA-Z]/g, '');
  const upperLetters = letters.replace(/[^A-Z]/g, '').length;
  const capsRatio = letters.length > 0
    ? parseFloat((upperLetters / letters.length).toFixed(4))
    : 0;

  // Suspicious patterns
  let suspiciousPatternCount = 0;
  for (const pattern of SUSPICIOUS_PATTERNS) {
    const matches = text.match(new RegExp(pattern.source, 'gi')) || [];
    suspiciousPatternCount += matches.length;
  }

  const allCapsWordCount = words.filter((w) => w.length > 2 && w === w.toUpperCase()).length;
  const hasHttpOnly = /http:\/\//i.test(text) && !/https:\/\//i.test(text) ? 1 : 0;
  const hasSuspiciousDomain = /\b\w+(-\w+){2,}\.(com|net|org)/i.test(text) ? 1 : 0;
  const claimsCompromised = /compromised|hacked|unauthorized|unauthorised|suspicious.activity/i.test(text) ? 1 : 0;
  const claimsPrize = /won|winner|prize|reward|congratulations|selected/i.test(text) ? 1 : 0;
  const hasBankKeyword = /bank|mpesa|equity|kcb|account|wallet/i.test(text) ? 1 : 0;
  const mentionsDeadline = /expire|hours?|today|immediately|before it|deadline/i.test(text) ? 1 : 0;
  const hasBankKeywordWithUrl = hasBankKeyword && urlCount > 0 ? 1 : 0;

  return {
    textLength,
    wordCount,
    urlCount,
    urgencyWordCount,
    sensitiveWordCount,
    exclamationCount,
    capsRatio,
    suspiciousPatternCount,
    allCapsWordCount,
    hasHttpOnly,
    hasSuspiciousDomain,
    claimsCompromised,
    claimsPrize,
    mentionsDeadline,
    hasBankKeywordWithUrl,
  };
};

// ─────────────────── weighted scoring ────────────────────────

/**
 * Evaluate whether a single feature triggers its weight.
 * @param {number} value   - Feature value.
 * @param {{threshold: number, weight: number, direction: string}} rule
 * @returns {number} Points to add (0 or weight).
 */
const evalRule = (value, rule) => {
  switch (rule.direction) {
    case 'above':
      return value > rule.threshold ? rule.weight : 0;
    case 'above_eq':
      return value >= rule.threshold ? rule.weight : 0;
    case 'equals':
      return value === rule.threshold ? rule.weight : 0;
    default:
      return 0;
  }
};

/**
 * Apply URL feature weights and return a 0–100 risk score.
 *
 * @param {Record<string, number>} features - Output of extractUrlFeatures().
 * @returns {number} Risk score capped at 100.
 */
const scoreUrlFeatures = (features) => {
  if (!features || typeof features !== 'object') return 0;

  let score = 0;
  for (const [key, rule] of Object.entries(URL_WEIGHTS)) {
    const value = features[key];
    if (typeof value !== 'number') continue;
    score += evalRule(value, rule);
  }
  return Math.min(100, score);
};

/**
 * Apply message feature weights and return a 0–100 risk score.
 *
 * @param {Record<string, number>} features - Output of extractMessageFeatures().
 * @returns {number} Risk score capped at 100.
 */
const scoreMessageFeatures = (features) => {
  if (!features || typeof features !== 'object') return 0;

  let score = 0;
  for (const [key, rule] of Object.entries(MSG_WEIGHTS)) {
    const value = features[key];
    if (typeof value !== 'number') continue;
    score += evalRule(value, rule);
  }
  return Math.min(100, score);
};

// ─────────────────────── exports ─────────────────────────────

module.exports = {
  extractUrlFeatures,
  extractMessageFeatures,
  scoreUrlFeatures,
  scoreMessageFeatures,
};
