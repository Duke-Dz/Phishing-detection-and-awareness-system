/**
 * @module kenyanPatterns
 * @description Kenya-specific phishing detection data and helper functions.
 *
 * Contains well-known Kenyan brands that are commonly impersonated,
 * phishing phrases targeting Kenyan users, and sender-ID patterns
 * often spoofed in SMS/smishing campaigns.
 */

'use strict';

// ──────────────────────────────────────────────
//  Kenyan brands & impersonation keywords
// ──────────────────────────────────────────────

/**
 * @typedef {Object} KenyanBrand
 * @property {string}   name     — Canonical brand name
 * @property {string[]} keywords — Lowercase keywords/typos used in impersonation
 */

/** @type {KenyanBrand[]} */
const kenyanBrands = [
  { name: 'Safaricom', keywords: ['safaricom', 'safaricorn', 'safaricomm'] },
  { name: 'M-Pesa', keywords: ['mpesa', 'm-pesa', 'mpeza', 'emmpesa'] },
  { name: 'Equity Bank', keywords: ['equity', 'equitybank', 'equitty'] },
  { name: 'KCB', keywords: ['kcb', 'kcb bank', 'kcbgroup'] },
  { name: 'Co-operative Bank', keywords: ['cooperative', 'coop bank', 'coopbank'] },
  { name: 'Stanbic', keywords: ['stanbic', 'stanbicbank'] },
  { name: 'NCBA', keywords: ['ncba', 'ncbabank'] },
  { name: 'ABSA', keywords: ['absa', 'absabank', 'barclays'] },
  { name: 'KRA', keywords: ['kra', 'kenya revenue', 'itax', 'etims'] },
  { name: 'NHIF', keywords: ['nhif', 'sha', 'shif'] },
  { name: 'NSSF', keywords: ['nssf'] },
  { name: 'Kenya Power', keywords: ['kplc', 'kenya power', 'kenyapower'] },
  { name: 'HELB', keywords: ['helb', 'higher education'] },
];

// ──────────────────────────────────────────────
//  Kenyan phishing phrases
// ──────────────────────────────────────────────

/**
 * Common phrases found in Kenya-targeted phishing messages.
 * All entries are lowercase for case-insensitive matching.
 * @type {string[]}
 */
const kenyanPhishingPhrases = [
  'fuliza limit',
  'mpesa reversal',
  'kra pin',
  'etims compliance',
  'helb loan clearance',
  'confirm your m-pesa pin',
  'safaricom promotion',
  'airtime reward',
  'free data bundle',
  'sim swap',
  'mpesa statement',
  'kra tax refund',
  'nhif card',
  'nssf statement',
  'till number',
  'paybill',
  'lipa na mpesa',
  'stk push',
  'mpesa balance',
  'account suspended safaricom',
  'equity mobile',
  'kcb mpesa',
];

// ──────────────────────────────────────────────
//  Sender-ID patterns (strings, not RegExp)
// ──────────────────────────────────────────────

/**
 * Commonly spoofed sender IDs in Kenyan smishing campaigns.
 * Stored as plain strings so they can be serialised / persisted.
 * @type {string[]}
 */
const kenyanSenderPatterns = [
  'safaricom',
  'mpesa',
  'equity',
  'kcb-mpesa',
  'kra',
  'nhif',
];

// ──────────────────────────────────────────────
//  Helper functions
// ──────────────────────────────────────────────

/**
 * Scan text for Kenyan brand impersonation.
 *
 * Performs a case-insensitive search against every keyword of every
 * known Kenyan brand. Returns the unique list of matched brand names.
 *
 * @param {string} text — Text to analyse (email body, SMS, etc.)
 * @returns {{ detected: boolean, brands: string[] }}
 */
const checkKenyanImpersonation = (text) => {
  if (!text || typeof text !== 'string') {
    return { detected: false, brands: [] };
  }

  const lowerText = text.toLowerCase();
  const matchedBrands = [];

  for (const brand of kenyanBrands) {
    const hit = brand.keywords.some((kw) => lowerText.includes(kw));
    if (hit) {
      matchedBrands.push(brand.name);
    }
  }

  return {
    detected: matchedBrands.length > 0,
    brands: matchedBrands,
  };
};

/**
 * Scan text for common Kenyan phishing phrases.
 *
 * @param {string} text — Text to analyse
 * @returns {{ detected: boolean, phrases: string[] }}
 */
const checkKenyanPhishingPhrases = (text) => {
  if (!text || typeof text !== 'string') {
    return { detected: false, phrases: [] };
  }

  const lowerText = text.toLowerCase();
  const matchedPhrases = kenyanPhishingPhrases.filter((phrase) =>
    lowerText.includes(phrase),
  );

  return {
    detected: matchedPhrases.length > 0,
    phrases: matchedPhrases,
  };
};

// ──────────────────────────────────────────────
//  Exports
// ──────────────────────────────────────────────

module.exports = {
  kenyanBrands,
  kenyanPhishingPhrases,
  kenyanSenderPatterns,
  checkKenyanImpersonation,
  checkKenyanPhishingPhrases,
};
