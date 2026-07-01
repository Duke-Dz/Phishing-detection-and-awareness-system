/**
 * External Threat Intelligence Service
 *
 * Uses Google Safe Browsing as the lightweight first external URL check and
 * gates VirusTotal behind cache, local-risk, internal blacklist, or Google hits.
 * The backend keeps working when keys are missing or providers fail.
 */

const https = require("https");
const { ThreatIntelligence } = require("../models");
const logger = require("../utils/logger");

const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000;
const DEFAULT_VT_MIN_LOCAL_SCORE = 50;
const VT_MAX_PER_MINUTE = 4;
const VT_MAX_PER_DAY = 500;
const vtRequestTimestamps = [];
let vtDailyCount = 0;
let vtDailyResetTime = Date.now() + 24 * 60 * 60 * 1000;
const providerState = {
  google_safe_browsing: { status: "unknown", last_attempt_at: null, last_success_at: null, reason: null },
  virustotal: { status: "unknown", last_attempt_at: null, last_success_at: null, reason: null },
};

const recordProviderState = (source, result) => {
  const now = new Date().toISOString();
  const reason = result.reason || null;
  let status = result.status;
  if (reason === "api_key_missing" || reason === "disabled") status = "disabled";
  else if (reason === "rate_limited") status = "rate_limited";
  else if (/http_(401|403)|submit_http_(401|403)/.test(reason || "")) status = "rejected";
  else if (["queried", "submitted"].includes(result.status) && ["matched", "no_match", "not_in_database"].includes(reason)) status = "successful";
  else if (result.status === "failed") status = "unavailable";
  providerState[source] = {
    status,
    reason,
    last_attempt_at: result.status === "skipped" ? providerState[source].last_attempt_at : now,
    last_success_at: status === "successful" ? now : providerState[source].last_success_at,
  };
};

const parseBoolEnv = (key, defaultValue = true) => {
  const value = process.env[key];
  if (value === undefined || value === "") return defaultValue;
  return !["false", "0", "no", "off"].includes(String(value).toLowerCase());
};

const getExternalThreatConfig = () => {
  const cacheMinutes = Number.parseInt(process.env.EXTERNAL_THREAT_CACHE_TTL_MINUTES || "60", 10);
  const vtThreshold = Number.parseInt(
    process.env.VIRUSTOTAL_MIN_LOCAL_SCORE || `${DEFAULT_VT_MIN_LOCAL_SCORE}`,
    10,
  );

  return {
    mode: String(process.env.EXTERNAL_THREAT_MODE || "gated").toLowerCase(),
    googleEnabled: parseBoolEnv("GOOGLE_SAFE_BROWSING_ENABLED", true),
    virusTotalEnabled: parseBoolEnv("VIRUSTOTAL_ENABLED", true),
    virusTotalMinLocalScore: Number.isFinite(vtThreshold) ? vtThreshold : DEFAULT_VT_MIN_LOCAL_SCORE,
    cacheTtlMs: Number.isFinite(cacheMinutes) && cacheMinutes > 0
      ? cacheMinutes * 60 * 1000
      : DEFAULT_CACHE_TTL_MS,
  };
};

const providerUsage = (source, status, reason, extra = {}) => ({
  source,
  status,
  reason,
  ...extra,
});

const normalizeThreatType = (value) => {
  const threatType = String(value || "unknown").toLowerCase();
  if (["phishing", "social_engineering", "credential_theft"].includes(threatType)) {
    return "phishing";
  }
  if (["malware", "unwanted_software", "potentially_harmful_application"].includes(threatType)) {
    return "malware";
  }
  if (threatType === "spam") return "spam";
  return "unknown";
};

const canMakeVtRequest = () => {
  const now = Date.now();

  if (now > vtDailyResetTime) {
    vtDailyCount = 0;
    vtDailyResetTime = now + 24 * 60 * 60 * 1000;
  }

  if (vtDailyCount >= VT_MAX_PER_DAY) return false;

  while (vtRequestTimestamps.length > 0 && vtRequestTimestamps[0] < now - 60000) {
    vtRequestTimestamps.shift();
  }

  return vtRequestTimestamps.length < VT_MAX_PER_MINUTE;
};

const recordVtRequest = () => {
  vtRequestTimestamps.push(Date.now());
  vtDailyCount += 1;
};

const parseJsonOrNull = (data) => {
  try {
    return data ? JSON.parse(data) : {};
  } catch {
    return null;
  }
};

const httpsPost = (url, body, timeoutMs = 5000, extraHeaders = {}) =>
  new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const isRawBody = typeof body === "string" || Buffer.isBuffer(body);
      const postData = isRawBody ? body : JSON.stringify(body);

      const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: "POST",
        headers: {
          "Content-Type": isRawBody ? "application/x-www-form-urlencoded" : "application/json",
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
          resolve({ statusCode: res.statusCode, body: parseJsonOrNull(data) });
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
          resolve({ statusCode: res.statusCode, body: parseJsonOrNull(data) });
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

const checkGoogleSafeBrowsing = async (url) => {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  const result = {
    source: "google_safe_browsing",
    isMalicious: false,
    threatType: null,
    confidence: 0,
    status: "skipped",
    reason: null,
  };

  if (!apiKey) {
    logger.debug("Google Safe Browsing API key not configured - skipping");
    result.reason = "api_key_missing";
    recordProviderState(result.source, result);
    return result;
  }

  const requestBody = {
    client: {
      clientId: "cybersense-engine",
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
    result.status = "queried";
    const response = await httpsPost(endpoint, requestBody, 6000);

    if (!response || response.statusCode !== 200) {
      logger.warn("Google Safe Browsing API returned non-200 or failed");
      result.status = "failed";
      result.reason = response ? `http_${response.statusCode}` : "request_failed";
      return result;
    }

    if (response.body?.matches?.length > 0) {
      const match = response.body.matches[0];
      result.isMalicious = true;
      result.threatType = (match.threatType || "unknown").toLowerCase();
      result.confidence = 90;
    }

    result.reason = result.isMalicious ? "matched" : "no_match";
    return result;
  } catch (error) {
    logger.warn(`Google Safe Browsing lookup failed: ${error.message}`);
    result.status = "failed";
    result.reason = "exception";
    return result;
  } finally {
    recordProviderState(result.source, result);
  }
};

const checkVirusTotal = async (url) => {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  const result = {
    source: "virustotal",
    isMalicious: false,
    threatType: null,
    confidence: 0,
    details: null,
    status: "skipped",
    reason: null,
  };

  if (!apiKey) {
    logger.debug("VirusTotal API key not configured - skipping");
    result.reason = "api_key_missing";
    recordProviderState(result.source, result);
    return result;
  }

  if (!canMakeVtRequest()) {
    logger.debug("VirusTotal rate limit reached - skipping");
    result.reason = "rate_limited";
    recordProviderState(result.source, result);
    return result;
  }

  try {
    const urlId = Buffer.from(url)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const lookupEndpoint = `https://www.virustotal.com/api/v3/urls/${urlId}`;

    recordVtRequest();
    result.status = "queried";

    const response = await httpsGet(lookupEndpoint, 8000, {
      "x-apikey": apiKey,
    });

    if (!response) {
      logger.warn("VirusTotal API request failed (no response)");
      result.status = "failed";
      result.reason = "request_failed";
      return result;
    }

    if (response.statusCode === 404) {
      if (!canMakeVtRequest()) {
        result.reason = "rate_limited";
        return result;
      }

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

      if (submitResponse && [200, 202].includes(submitResponse.statusCode)) {
        logger.info(`URL submitted to VirusTotal for analysis: ${url}`);
        result.status = "submitted";
        result.reason = "not_in_database";
      } else {
        result.status = "failed";
        result.reason = submitResponse ? `submit_http_${submitResponse.statusCode}` : "submit_failed";
      }

      return result;
    }

    if (response.statusCode !== 200) {
      logger.warn(`VirusTotal API returned status ${response.statusCode}`);
      result.status = "failed";
      result.reason = `http_${response.statusCode}`;
      return result;
    }

    const data = response.body?.data?.attributes;
    if (!data?.last_analysis_stats) {
      result.reason = "no_analysis_stats";
      return result;
    }

    const stats = data.last_analysis_stats;
    const maliciousCount = stats.malicious || 0;
    const suspiciousCount = stats.suspicious || 0;
    const flaggedCount = maliciousCount + suspiciousCount;
    const totalEngines =
      maliciousCount +
      suspiciousCount +
      (stats.undetected || 0) +
      (stats.harmless || 0);

    result.details = {
      malicious: maliciousCount,
      suspicious: suspiciousCount,
      harmless: stats.harmless || 0,
      undetected: stats.undetected || 0,
      total_engines: totalEngines,
      reputation: data.reputation || 0,
      categories: data.categories || {},
    };

    if (totalEngines > 0 && (maliciousCount >= 3 || flaggedCount >= 5)) {
      result.isMalicious = true;
      result.confidence = Math.min(100, Math.round((flaggedCount / totalEngines) * 100) + 20);
      result.threatType = maliciousCount > suspiciousCount ? "phishing" : "suspicious";
    } else if (totalEngines > 0 && maliciousCount >= 1) {
      result.isMalicious = true;
      result.confidence = Math.min(70, Math.round((flaggedCount / totalEngines) * 100) + 10);
      result.threatType = "suspicious";
    }

    result.reason = result.isMalicious ? "matched" : "no_match";
    return result;
  } catch (error) {
    logger.warn(`VirusTotal lookup failed: ${error.message}`);
    result.status = "failed";
    result.reason = "exception";
    return result;
  } finally {
    recordProviderState(result.source, result);
  }
};

const shouldQueryVirusTotal = ({ config = getExternalThreatConfig(), localScore = 0, googleResult = null, internalThreatIntel = null }) => {
  if (!config.virusTotalEnabled) return { allowed: false, reason: "disabled" };
  if (config.mode === "off" || config.mode === "local_only") {
    return { allowed: false, reason: "external_mode_off" };
  }
  if (config.mode === "all" || config.mode === "aggressive") {
    return { allowed: true, reason: "mode_all" };
  }
  if (googleResult?.isMalicious) {
    return { allowed: true, reason: "google_flagged" };
  }
  if (internalThreatIntel?.is_blacklisted) {
    return { allowed: true, reason: "internal_blacklist" };
  }
  if (Number(localScore || 0) >= config.virusTotalMinLocalScore) {
    return { allowed: true, reason: "local_score_threshold" };
  }
  return { allowed: false, reason: "below_local_score_threshold" };
};

const checkExternalSources = async (url, domain, options = {}) => {
  const result = {
    sources: [],
    aggregateScore: 0,
    isMalicious: false,
    usage: [],
    cacheHit: false,
  };

  if (!domain) return result;

  const config = getExternalThreatConfig();
  const cached = await ThreatIntelligence.findOne({ where: { domain } });
  if (cached?.last_checked) {
    const age = Date.now() - new Date(cached.last_checked).getTime();
    if (age < config.cacheTtlMs) {
      return {
        sources: cached.api_sources || [],
        aggregateScore: cached.reputation_score || 0,
        isMalicious: cached.is_blacklisted || false,
        usage: [providerUsage("cache", "hit", "fresh_domain_cache", { age_ms: age })],
        cacheHit: true,
      };
    }
  }

  if (config.mode === "off" || config.mode === "local_only") {
    result.usage.push(providerUsage("external_threat_intel", "skipped", "external_mode_off"));
    return result;
  }

  let safeBrowsingResult = {
    source: "google_safe_browsing",
    isMalicious: false,
    threatType: null,
    confidence: 0,
    status: "skipped",
    reason: "disabled",
  };

  if (config.googleEnabled) {
    safeBrowsingResult = await checkGoogleSafeBrowsing(url);
  }
  result.usage.push(providerUsage(
    "google_safe_browsing",
    safeBrowsingResult.status || "queried",
    safeBrowsingResult.reason || "completed",
  ));

  let virusTotalResult = {
    source: "virustotal",
    isMalicious: false,
    threatType: null,
    confidence: 0,
    details: null,
    status: "skipped",
    reason: "disabled",
  };

  const vtDecision = shouldQueryVirusTotal({
    config,
    localScore: options.localScore,
    googleResult: safeBrowsingResult,
    internalThreatIntel: options.internalThreatIntel,
  });

  if (vtDecision.allowed) {
    virusTotalResult = await checkVirusTotal(url);
    result.usage.push(providerUsage(
      "virustotal",
      virusTotalResult.status || "queried",
      virusTotalResult.reason || vtDecision.reason,
      { gate_reason: vtDecision.reason },
    ));
  } else {
    result.usage.push(providerUsage("virustotal", "skipped", vtDecision.reason));
  }

  const sources = [safeBrowsingResult, virusTotalResult];
  result.sources = sources;

  const maliciousSources = sources.filter((source) => source.isMalicious);
  if (maliciousSources.length > 0) {
    result.isMalicious = true;
    result.aggregateScore = Math.max(...maliciousSources.map((source) => source.confidence));
  }

  try {
    const cachePayload = {
      is_blacklisted: cached?.is_blacklisted || result.isMalicious,
      reputation_score: result.isMalicious
        ? Math.max(cached?.reputation_score || 0, result.aggregateScore)
        : cached?.reputation_score || 0,
      api_sources: sources,
      last_checked: new Date(),
      blacklist_sources: result.isMalicious
        ? [...new Set([...(cached?.blacklist_sources || []), ...maliciousSources.map((source) => source.source)])]
        : cached?.blacklist_sources || [],
      threat_type: result.isMalicious
        ? normalizeThreatType(maliciousSources[0]?.threatType || cached?.threat_type)
        : cached?.threat_type || "unknown",
    };

    if (cached) {
      await cached.update(cachePayload);
    } else {
      await ThreatIntelligence.create({
        domain,
        ...cachePayload,
      });
    }
  } catch (error) {
    logger.warn(`Failed to cache threat intel for ${domain}: ${error.message}`);
  }

  return result;
};

const getApiStatus = () => {
  const config = getExternalThreatConfig();
  const gsbKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  const vtKey = process.env.VIRUSTOTAL_API_KEY;

  return {
    mode: config.mode,
    cache_ttl_minutes: Math.round(config.cacheTtlMs / 60000),
    google_safe_browsing: {
      configured: Boolean(gsbKey && gsbKey.length > 0),
      enabled: config.googleEnabled,
      ...providerState.google_safe_browsing,
    },
    virustotal: {
      configured: Boolean(vtKey && vtKey.length > 0),
      enabled: config.virusTotalEnabled,
      min_local_score: config.virusTotalMinLocalScore,
      daily_quota_remaining: VT_MAX_PER_DAY - vtDailyCount,
      requests_this_minute: vtRequestTimestamps.filter((t) => t > Date.now() - 60000).length,
      ...providerState.virustotal,
    },
  };
};

module.exports = {
  checkGoogleSafeBrowsing,
  checkVirusTotal,
  checkExternalSources,
  getApiStatus,
  shouldQueryVirusTotal,
};
