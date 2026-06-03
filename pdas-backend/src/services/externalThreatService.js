/**
 * External Threat Intelligence Service
 * Integrates with Google Safe Browsing API for real-time URL reputation checks.
 * Gracefully degrades when API keys are unavailable.
 */

const https = require("https");
const { ThreatIntelligence } = require("../models");
const logger = require("../utils/logger");

// ── Cache TTL: avoid re-querying the same domain within 1 hour ──
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Makes an HTTPS POST request and returns parsed JSON.
 * @param {string} url - The full URL to POST to.
 * @param {object} body - The JSON body to send.
 * @param {number} timeoutMs - Request timeout in milliseconds.
 * @returns {Promise<object|null>}
 */
const httpsPost = (url, body, timeoutMs = 5000) =>
  new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const postData = JSON.stringify(body);

      const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: timeoutMs,
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve(null);
          }
        });
      });

      req.on("error", () => resolve(null));
      req.on("timeout", () => {
        req.destroy();
        resolve(null);
      });

      req.write(postData);
      req.end();
    } catch {
      resolve(null);
    }
  });

/**
 * Check a URL against Google Safe Browsing API v4.
 * Requires GOOGLE_SAFE_BROWSING_API_KEY environment variable.
 * @param {string} url - The URL to check.
 * @returns {Promise<{source: string, isMalicious: boolean, threatType: string|null, confidence: number}>}
 */
const checkGoogleSafeBrowsing = async (url) => {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  const result = { source: "google_safe_browsing", isMalicious: false, threatType: null, confidence: 0 };

  if (!apiKey) {
    logger.debug("Google Safe Browsing API key not configured — skipping");
    return result;
  }

  const requestBody = {
    client: {
      clientId: "phishguard-pdas",
      clientVersion: "2.0.0",
    },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

  try {
    const response = await httpsPost(endpoint, requestBody, 6000);

    if (!response || response.statusCode !== 200) {
      logger.warn("Google Safe Browsing API returned non-200 or failed");
      return result;
    }

    const { body } = response;

    if (body.matches && body.matches.length > 0) {
      const match = body.matches[0];
      result.isMalicious = true;
      result.threatType = (match.threatType || "UNKNOWN").toLowerCase();
      result.confidence = 90;
    }

    return result;
  } catch (error) {
    logger.warn(`Google Safe Browsing lookup failed: ${error.message}`);
    return result;
  }
};

/**
 * Run all configured external threat checks for a domain/URL.
 * Results are cached in the ThreatIntelligence table.
 * @param {string} url - The full URL to check.
 * @param {string} domain - The extracted domain.
 * @returns {Promise<{sources: object[], aggregateScore: number, isMalicious: boolean}>}
 */
const checkExternalSources = async (url, domain) => {
  const result = { sources: [], aggregateScore: 0, isMalicious: false };

  if (!domain) return result;

  // ── Check cache first ──
  const cached = await ThreatIntelligence.findOne({ where: { domain } });
  if (cached && cached.last_checked) {
    const age = Date.now() - new Date(cached.last_checked).getTime();
    if (age < CACHE_TTL_MS) {
      return {
        sources: cached.api_sources || [],
        aggregateScore: cached.reputation_score || 0,
        isMalicious: cached.is_blacklisted || false,
      };
    }
  }

  // ── Query external APIs in parallel ──
  const [safeBrowsingResult] = await Promise.all([
    checkGoogleSafeBrowsing(url),
    // Future: add checkVirusTotal(url), checkPhishTank(url) here
  ]);

  const sources = [safeBrowsingResult].filter(Boolean);
  result.sources = sources;

  // ── Aggregate results ──
  const maliciousSources = sources.filter((s) => s.isMalicious);
  if (maliciousSources.length > 0) {
    result.isMalicious = true;
    result.aggregateScore = Math.max(...maliciousSources.map((s) => s.confidence));
  }

  // ── Cache the result ──
  try {
    if (cached) {
      await cached.update({
        is_blacklisted: cached.is_blacklisted || result.isMalicious,
        reputation_score: result.isMalicious
          ? Math.max(cached.reputation_score || 0, result.aggregateScore)
          : cached.reputation_score || 0,
        api_sources: sources,
        last_checked: new Date(),
        blacklist_sources: result.isMalicious
          ? [...new Set([...(cached.blacklist_sources || []), ...maliciousSources.map((s) => s.source)])]
          : cached.blacklist_sources || [],
      });
    } else if (result.isMalicious) {
      await ThreatIntelligence.create({
        domain,
        reputation_score: result.aggregateScore,
        is_blacklisted: true,
        blacklist_sources: maliciousSources.map((s) => s.source),
        threat_type: maliciousSources[0]?.threatType || "unknown",
        api_sources: sources,
        last_checked: new Date(),
      });
    }
  } catch (error) {
    logger.warn(`Failed to cache threat intel for ${domain}: ${error.message}`);
  }

  return result;
};

module.exports = { checkGoogleSafeBrowsing, checkExternalSources };
