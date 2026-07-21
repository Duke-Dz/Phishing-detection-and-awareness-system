const { ThreatIntelligence } = require("../models");

// ── In-memory domain cache (5-minute TTL) ────────────────────────────────────
const domainCache = new Map();
const inFlightDomainLookups = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const builtInBlacklistedDomains = new Set([
  "paypa1-secure.com",
  "secure-login-verification.com",
  "account-update-alert.com",
  "bank-verification-now.com",
]);

const buildBuiltInThreat = (domain) => ({
  domain,
  reputation_score: 95,
  is_blacklisted: true,
  blacklist_sources: ["built-in-feed"],
  threat_type: "phishing",
});

const extractDomain = (rawUrl) => {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch (_error) {
    return "";
  }
};

const queryDomain = async (domain) => {
  const builtInThreat = builtInBlacklistedDomains.has(domain)
    ? buildBuiltInThreat(domain)
    : null;

  try {
    const databaseRecord = await ThreatIntelligence.findOne({ where: { domain } });
    if (databaseRecord) {
      domainCache.set(domain, { data: databaseRecord, expires: Date.now() + CACHE_TTL_MS });
      return databaseRecord;
    }

    if (builtInThreat) {
      // Persist to DB in the background — don't block the hot read path
      ThreatIntelligence.create(builtInThreat).catch(() => {});
      domainCache.set(domain, { data: builtInThreat, expires: Date.now() + CACHE_TTL_MS });
      return builtInThreat;
    }
  } catch (_error) {
    if (builtInThreat) {
      domainCache.set(domain, { data: builtInThreat, expires: Date.now() + CACHE_TTL_MS });
    }
    return builtInThreat;
  }

  // Cache null results too to avoid repeated DB lookups for unknown domains
  domainCache.set(domain, { data: null, expires: Date.now() + CACHE_TTL_MS });
  return null;
};

const lookupDomain = async (domain) => {
  if (!domain) return null;

  const cached = domainCache.get(domain);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const existingLookup = inFlightDomainLookups.get(domain);
  if (existingLookup) return existingLookup;

  const lookup = queryDomain(domain).finally(() => {
    if (inFlightDomainLookups.get(domain) === lookup) {
      inFlightDomainLookups.delete(domain);
    }
  });
  inFlightDomainLookups.set(domain, lookup);
  return lookup;
};

const clearDomainCache = () => domainCache.clear();

module.exports = { extractDomain, lookupDomain, clearDomainCache };
