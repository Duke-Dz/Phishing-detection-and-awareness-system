/**
 * External Threat Intelligence Service
 * Integrates with Google Safe Browsing and VirusTotal APIs for real-time URL
 * reputation checks. Gracefully degrades when API keys are unavailable.
 *
 * Multi-tiered approach:
 *  - Google Safe Browsing: fast, binary (safe/unsafe), high quota
 *  - VirusTotal: detailed, 70+ engines, granular risk score, low free quota
 */

const https = require("https");
const { ThreatIntelligence } = require("../models");
const logger = require("../utils/logger");

// ── Cache TTL: avoid re-querying the same domain within 1 hour ──
const CACHE_TTL_MS = 60 * 60 * 1000;

// ── VirusTotal rate limiting (free tier: 4 req/min, 500 req/day) ──
const VT_MAX_PER_MINUTE = 4;
const VT_MAX_PER_DAY = 500;
const vtRequestTimestamps = [];
let vtDailyCount = 0;
let vtDailyResetTime = Date.now() + 24 * 60 * 60 * 1000;

/**
 * Check if VirusTotal rate limit allows another request.
 * @returns {boolean}
 */
const canMakeVtRequest = () => {
  const now = Date.now();

  // Reset daily counter
  if (now > vtDailyResetTime) {
    vtDailyCount = 0;
    vtDailyResetTime = now + 24 * 60 * 60 * 1000;
  }

  if (vtDailyCount >= VT_MAX_PER_DAY) return false;

  // Clean timestamps older than 1 minute
  while (vtRequestTimestamps.length > 0 && vtRequestTimestamps[0] < now - 60000) {
    vtRequestTimestamps.shift();
  }

  return vtRequestTimestamps.length < VT_MAX_PER_MINUTE;
};

const recordVtRequest = () => {
  vtRequestTimestamps.push(Date.now());
  vtDailyCount++;
};

/**
 * Makes an HTTPS POST request and returns parsed JSON.
 * @param {string} url - The full URL to POST to.
 * @param {object} body - The JSON body to send.
 * @param {number} timeoutMs - Request timeout in milliseconds.
 * @param {object} [extraHeaders] - Additional headers to include.
 * @returns {Promise<object|null>}
 */
const httpsPost = (url, body, timeoutMs = 5000, extraHeaders = {}) =>
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
          ...extraHeaders,
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
 * Makes an HTTPS GET request and returns parsed JSON.
 * @param {string} url - The full URL to GET.
 * @param {number} timeoutMs - Request timeout in milliseconds.
 * @param {object} [extraHeaders] - Additional headers to include.
 * @returns {Promise<object|null>}
 */
const httpsGet = (url, timeoutMs = 5000, extraHeaders = {}) =>
  new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);

      const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: "GET",
        headers: { ...extraHeaders },
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
 * Check a URL against VirusTotal API v3.
 * Requires VIRUSTOTAL_API_KEY environment variable.
 * Free tier: 4 requests/minute, 500 requests/day.
 *
 * @param {string} url - The URL to check.
 * @returns {Promise<{source: string, isMalicious: boolean, threatType: string|null, confidence: number, details: object|null}>}
 */
const checkVirusTotal = async (url) => {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  const result = {
    source: "virustotal",
    isMalicious: false,
    threatType: null,
    confidence: 0,
    details: null,
  };

  if (!apiKey) {
    logger.debug("VirusTotal API key not configured — skipping");
    return result;
  }

  if (!canMakeVtRequest()) {
    logger.debug("VirusTotal rate limit reached — skipping");
    return result;
  }

  try {
    // Step 1: Submit URL for scanning
    const urlId = Buffer.from(url).toString("base64").replace(/=+$/, "");
    const lookupEndpoint = `https://www.virustotal.com/api/v3/urls/${urlId}`;

    recordVtRequest();

    const response = await httpsGet(lookupEndpoint, 8000, {
      "x-apikey": apiKey,
    });

    if (!response) {
      logger.warn("VirusTotal API request failed (no response)");
      return result;
    }

    // 404 means URL not in VT database — submit it
    if (response.statusCode === 404) {
      if (!canMakeVtRequest()) return result;

      recordVtRequest();
      const submitResponse = await httpsPost(
        "https://www.virustotal.com/api/v3/urls",
        `url=${encodeURIComponent(url)}`,
        8000,
        {
          "x-apikey": apiKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      );

      if (submitResponse && submitResponse.statusCode === 200) {
        logger.info(`URL submitted to VirusTotal for analysis: ${url}`);
      }

      // Can't get results immediately after submission
      return result;
    }

    if (response.statusCode !== 200) {
      logger.warn(`VirusTotal API returned status ${response.statusCode}`);
      return result;
    }

    // Step 2: Parse the analysis results
    const data = response.body?.data?.attributes;
    if (!data || !data.last_analysis_stats) {
      return result;
    }

    const stats = data.last_analysis_stats;
    const totalEngines = stats.malicious + stats.suspicious + stats.undetected + stats.harmless;
    const maliciousCount = stats.malicious || 0;
    const suspiciousCount = stats.suspicious || 0;
    const flaggedCount = maliciousCount + suspiciousCount;

    result.details = {
      malicious: maliciousCount,
      suspicious: suspiciousCount,
      harmless: stats.harmless || 0,
      undetected: stats.undetected || 0,
      total_engines: totalEngines,
      reputation: data.reputation || 0,
      categories: data.categories || {},
    };

    // Determine if malicious based on detection ratio
    if (maliciousCount >= 3 || flaggedCount >= 5) {
      result.isMalicious = true;
      result.confidence = Math.min(100, Math.round((flaggedCount / totalEngines) * 100) + 20);
      result.threatType = maliciousCount > suspiciousCount ? "phishing" : "suspicious";
    } else if (maliciousCount >= 1) {
      result.isMalicious = true;
      result.confidence = Math.min(70, Math.round((flaggedCount / totalEngines) * 100) + 10);
      result.threatType = "suspicious";
    }

    return result;
  } catch (error) {
    logger.warn(`VirusTotal lookup failed: ${error.message}`);
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
  const [safeBrowsingResult, virusTotalResult] = await Promise.all([
    checkGoogleSafeBrowsing(url),
    checkVirusTotal(url),
  ]);

  const sources = [safeBrowsingResult, virusTotalResult].filter(Boolean);
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

/**
 * Get the configuration status of external API keys.
 * Returns whether each API is configured WITHOUT exposing actual keys.
 * @returns {object}
 */
const getApiStatus = () => {
  const gsbKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  const vtKey = process.env.VIRUSTOTAL_API_KEY;

  return {
    google_safe_browsing: {
      configured: Boolean(gsbKey && gsbKey.length > 0),
    },
    virustotal: {
      configured: Boolean(vtKey && vtKey.length > 0),
      daily_quota_remaining: VT_MAX_PER_DAY - vtDailyCount,
      requests_this_minute: vtRequestTimestamps.filter((t) => t > Date.now() - 60000).length,
    },
  };
};

module.exports = { checkGoogleSafeBrowsing, checkVirusTotal, checkExternalSources, getApiStatus };
