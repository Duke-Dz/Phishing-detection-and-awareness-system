const { ThreatIntelligence } = require("../models");

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

const lookupDomain = async (domain) => {
  if (!domain) return null;

  const builtInThreat = builtInBlacklistedDomains.has(domain)
    ? buildBuiltInThreat(domain)
    : null;

  try {
    const databaseRecord = await ThreatIntelligence.findOne({ where: { domain } });
    if (databaseRecord) return databaseRecord;

    if (builtInThreat) {
      return ThreatIntelligence.create(builtInThreat);
    }
  } catch (_error) {
    return builtInThreat;
  }

  return builtInThreat;
};

module.exports = { extractDomain, lookupDomain };
