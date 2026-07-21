/**
 * External Threat Intelligence Service
 *
 * Uses Google Safe Browsing v5 as the lightweight first external URL check and
 * gates VirusTotal behind cache, local-risk, internal blacklist, or Google hits.
 * The backend keeps working when keys are missing or providers fail.
 */

const https = require("https");
const { ThreatIntelligence } = require("../models");
const logger = require("../utils/logger");

const DEFAULT_CACHE_TTL_MS = 60 * 60 * 1000;
// Query VirusTotal once local analysis has found meaningful suspicion.  A
// threshold of 50 allowed single strong URL-deception signals to be averaged
// down before VirusTotal was ever consulted.
const DEFAULT_VT_MIN_LOCAL_SCORE = 25;
const VT_MAX_PER_MINUTE = 4;
const VT_MAX_PER_DAY = 500;
const vtRequestTimestamps = [];
let vtDailyCount = 0;
let vtDailyResetTime = Date.now() + 24 * 60 * 60 * 1000;
const providerState = {
  google_safe_browsing: { status: "unknown", last_attempt_at: null, last_success_at: null, reason: null },
  virustotal: { status: "unknown", last_attempt_at: null, last_success_at: null, reason: null },
};
const EXTERNAL_PROVIDER_SOURCES = new Set(["google_safe_browsing", "virustotal"]);
const inFlightDomainReads = new Map();
const pendingDomainCacheWrites = new Map();
const domainCacheWriteChains = new Map();
let domainCacheFlushScheduled = false;

const canonicalizeUrlCacheKey = (rawUrl) => {
  const value = String(rawUrl || "").replace(/[\t\r\n]/g, "").trim();

  try {
    const parsed = new URL(value);
    parsed.hash = "";
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();
    if (!parsed.pathname) parsed.pathname = "/";
    return parsed.href;
  } catch {
    return value.split("#", 1)[0];
  }
};

const parseGoogleCacheDurationMs = (duration) => {
  const match = String(duration || "").match(/^(\d+)(?:\.(\d{1,9}))?s$/);
  if (!match) return null;

  const seconds = Number(match[1]);
  const fractionalSeconds = Number(`0.${match[2] || "0"}`);
  const milliseconds = (seconds + fractionalSeconds) * 1000;
  return Number.isFinite(milliseconds) && milliseconds >= 0
    ? Math.round(milliseconds)
    : null;
};

const readFreshProviderCache = (record, source, cacheKey, now = Date.now()) => {
  const entries = Array.isArray(record?.api_sources) ? record.api_sources : [];
  const entry = entries.find((candidate) => (
    candidate?.source === source
    && candidate?.cache_key === cacheKey
    && Number.isFinite(Date.parse(candidate?.cache_expires_at))
    && Date.parse(candidate.cache_expires_at) > now
  ));

  return entry ? { ...entry } : null;
};

const cacheableProviderResult = (result) => (
  ["queried", "submitted"].includes(result?.status)
  && ["matched", "no_match", "not_in_database"].includes(result?.reason)
);

const buildProviderCacheEntry = (result, cacheKey, ttlMs, now = Date.now()) => ({
  ...result,
  cache_key: cacheKey,
  cached_at: new Date(now).toISOString(),
  cache_expires_at: new Date(now + ttlMs).toISOString(),
});

const mergeProviderCacheEntries = (record, newEntries, now = Date.now()) => {
  const existingEntries = Array.isArray(record?.api_sources) ? record.api_sources : [];
  const freshEntries = existingEntries.filter((entry) => (
    EXTERNAL_PROVIDER_SOURCES.has(entry?.source)
    && entry?.cache_key
    && Number.isFinite(Date.parse(entry?.cache_expires_at))
    && Date.parse(entry.cache_expires_at) > now
  ));

  for (const entry of newEntries) {
    const index = freshEntries.findIndex((candidate) => (
      candidate.source === entry.source && candidate.cache_key === entry.cache_key
    ));
    if (index >= 0) freshEntries[index] = entry;
    else freshEntries.push(entry);
  }

  return freshEntries.slice(-100);
};

const persistentDomainState = (record) => {
  const previousSources = Array.isArray(record?.blacklist_sources)
    ? record.blacklist_sources
    : [];
  const retainedSources = previousSources.filter((source) => !EXTERNAL_PROVIDER_SOURCES.has(source));
  const wasProviderOnlyBlacklist = Boolean(record?.is_blacklisted)
    && previousSources.some((source) => EXTERNAL_PROVIDER_SOURCES.has(source))
    && retainedSources.length === 0;

  return {
    isBlacklisted: wasProviderOnlyBlacklist ? false : Boolean(record?.is_blacklisted),
    reputationScore: wasProviderOnlyBlacklist ? 0 : Number(record?.reputation_score || 0),
    blacklistSources: retainedSources,
    threatType: wasProviderOnlyBlacklist ? "unknown" : (record?.threat_type || "unknown"),
    needsCleanup: previousSources.length !== retainedSources.length || wasProviderOnlyBlacklist,
  };
};

// A message can contain many URL paths on the same host. Coalesce the initial
// database lookup without caching the result beyond the concurrent read wave,
// so administrative threat-intel changes are not hidden by process memory.
const readThreatIntelRecord = (domain) => {
  const existingRead = inFlightDomainReads.get(domain);
  if (existingRead) return existingRead;

  const read = ThreatIntelligence.findOne({ where: { domain } })
    .finally(() => {
      if (inFlightDomainReads.get(domain) === read) {
        inFlightDomainReads.delete(domain);
      }
    });
  inFlightDomainReads.set(domain, read);
  return read;
};

const isUniqueConstraintError = (error) => (
  error?.name === "SequelizeUniqueConstraintError"
  || error?.original?.code === "23505"
  || error?.parent?.code === "23505"
);

const buildDomainCachePayload = (record, newEntries, now) => {
  const existingApiSources = Array.isArray(record?.api_sources) ? record.api_sources : [];
  const apiSources = mergeProviderCacheEntries(record, newEntries, now);
  const domainState = persistentDomainState(record);
  const prunedEntries = existingApiSources.length !== apiSources.length
    || existingApiSources.some((entry) => !entry?.cache_key || !entry?.cache_expires_at);

  if (newEntries.length === 0 && !domainState.needsCleanup && !prunedEntries) {
    return null;
  }

  return {
    is_blacklisted: domainState.isBlacklisted,
    reputation_score: domainState.reputationScore,
    api_sources: apiSources,
    last_checked: newEntries.length > 0 ? new Date(now) : record?.last_checked,
    blacklist_sources: domainState.blacklistSources,
    threat_type: normalizeThreatType(domainState.threatType),
  };
};

const persistDomainCacheBatch = async (domain, batch) => {
  const entries = batch.flatMap((item) => item.entries);
  const now = Math.max(...batch.map((item) => item.now), Date.now());
  let record = await ThreatIntelligence.findOne({ where: { domain } });
  let payload = buildDomainCachePayload(record, entries, now);
  if (!payload) return;

  if (record) {
    await record.update(payload);
    return;
  }

  try {
    await ThreatIntelligence.create({ domain, ...payload });
  } catch (error) {
    // Another process may have inserted this domain after our read. Refetch and
    // merge rather than dropping URL-specific cache entries or surfacing noise.
    if (!isUniqueConstraintError(error)) throw error;
    record = await ThreatIntelligence.findOne({ where: { domain } });
    if (!record) throw error;
    payload = buildDomainCachePayload(record, entries, now);
    if (payload) await record.update(payload);
  }
};

const flushDomainCacheWrites = async () => {
  domainCacheFlushScheduled = false;
  const queued = [...pendingDomainCacheWrites.entries()];
  pendingDomainCacheWrites.clear();

  await Promise.all(queued.map(async ([domain, batch]) => {
    const previousWrite = domainCacheWriteChains.get(domain) || Promise.resolve();
    const currentWrite = previousWrite
      .catch(() => {})
      .then(() => persistDomainCacheBatch(domain, batch));
    domainCacheWriteChains.set(domain, currentWrite);

    try {
      await currentWrite;
    } catch (error) {
      logger.warn("Threat-intelligence cache write failed", {
        domain,
        error: {
          name: error.name,
          message: error.message,
          code: error.original?.code || error.parent?.code,
        },
      });
    } finally {
      if (domainCacheWriteChains.get(domain) === currentWrite) {
        domainCacheWriteChains.delete(domain);
      }
      batch.forEach((item) => item.resolve());
    }
  }));
};

const queueDomainCacheWrite = (domain, entries, now = Date.now()) => new Promise((resolve) => {
  const batch = pendingDomainCacheWrites.get(domain) || [];
  batch.push({ entries, now, resolve });
  pendingDomainCacheWrites.set(domain, batch);

  if (!domainCacheFlushScheduled) {
    domainCacheFlushScheduled = true;
    setImmediate(() => {
      flushDomainCacheWrites().catch((error) => {
        logger.warn("Threat-intelligence cache queue failed", {
          error: { name: error.name, message: error.message },
        });
      });
    });
  }
});

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
    virusTotalAllowSubmission: parseBoolEnv("VIRUSTOTAL_ALLOW_SUBMISSION", false),
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

const GOOGLE_SAFE_BROWSING_BATCH_SIZE = 50;
const GOOGLE_SAFE_BROWSING_REQUEST_TARGET_BYTES = 7000;
let pendingGoogleLookups = [];
let googleBatchScheduled = false;

const createGoogleResult = () => ({
    source: "google_safe_browsing",
    isMalicious: false,
    threatType: null,
    confidence: 0,
    status: "skipped",
    reason: null,
});

const threatExpressionMatchesUrl = (expression, requestedUrl) => {
  try {
    const threat = new URL(expression);
    const requested = new URL(requestedUrl);
    const hostMatches = requested.hostname === threat.hostname
      || requested.hostname.endsWith(`.${threat.hostname}`);
    if (!hostMatches || requested.protocol !== threat.protocol) return false;

    const threatPath = threat.pathname || "/";
    const pathMatches = threatPath === "/"
      || requested.pathname === threatPath
      || requested.pathname.startsWith(threatPath.endsWith("/") ? threatPath : `${threatPath}/`);
    if (!pathMatches) return false;
    return !threat.search || requested.search === threat.search;
  } catch {
    return canonicalizeUrlCacheKey(expression) === canonicalizeUrlCacheKey(requestedUrl);
  }
};

const resolveGoogleLookup = (item, result) => {
  recordProviderState(result.source, result);
  item.resolve(result);
};

const buildGoogleBatchEndpoint = (items, apiKey) => {
  const endpoint = new URL("https://safebrowsing.googleapis.com/v5/urls:search");
  for (const item of items) endpoint.searchParams.append("urls", item.url);
  endpoint.searchParams.set("key", apiKey);
  return endpoint;
};

const googleRequestTargetBytes = (items, apiKey) => {
  const endpoint = buildGoogleBatchEndpoint(items, apiKey);
  return Buffer.byteLength(`${endpoint.pathname}${endpoint.search}`, "utf8");
};

const failGoogleItems = (items, reason) => {
  for (const item of items) {
    const result = createGoogleResult();
    result.status = "failed";
    result.reason = reason;
    resolveGoogleLookup(item, result);
  }
};

const executeGoogleBatch = async (items, apiKey) => {
  const endpoint = buildGoogleBatchEndpoint(items, apiKey);
  if (Buffer.byteLength(`${endpoint.pathname}${endpoint.search}`, "utf8") > GOOGLE_SAFE_BROWSING_REQUEST_TARGET_BYTES) {
    if (items.length > 1) {
      const midpoint = Math.ceil(items.length / 2);
      await Promise.all([
        executeGoogleBatch(items.slice(0, midpoint), apiKey),
        executeGoogleBatch(items.slice(midpoint), apiKey),
      ]);
    } else {
      failGoogleItems(items, "request_target_too_large");
    }
    return;
  }

  try {
    const response = await httpsGet(endpoint.href, 6000);
    if (!response || response.statusCode !== 200) {
      const reason = response ? `http_${response.statusCode}` : "request_failed";
      logger.warn("Google Safe Browsing lookup failed", {
        reason,
        status_code: response?.statusCode,
        batch_size: items.length,
      });
      if (items.length > 1 && response && [400, 414, 431].includes(response.statusCode)) {
        const midpoint = Math.ceil(items.length / 2);
        await Promise.all([
          executeGoogleBatch(items.slice(0, midpoint), apiKey),
          executeGoogleBatch(items.slice(midpoint), apiKey),
        ]);
      } else {
        failGoogleItems(
          items,
          reason,
        );
      }
      return;
    }

    const threats = Array.isArray(response.body?.threats) ? response.body.threats : [];
    const cacheDuration = response.body?.cacheDuration || null;
    const cacheDurationMs = parseGoogleCacheDurationMs(cacheDuration);

    for (const item of items) {
      const matches = threats.filter((threat) => (
        threat?.url && threatExpressionMatchesUrl(threat.url, item.url)
      ));
      const threatTypes = matches.flatMap((match) => match.threatTypes || []);
      const result = createGoogleResult();
      result.status = "queried";
      result.cacheDurationMs = cacheDurationMs;
      result.details = {
        threat_types: [...new Set(threatTypes.map((type) => String(type).toLowerCase()))],
        cache_duration: cacheDuration,
      };
      if (matches.length > 0) {
        result.isMalicious = true;
        result.threatType = threatTypes.includes("SOCIAL_ENGINEERING")
          ? "social_engineering"
          : (threatTypes[0] || "unknown").toLowerCase();
        result.confidence = 90;
      }
      result.reason = result.isMalicious ? "matched" : "no_match";
      resolveGoogleLookup(item, result);
    }
  } catch (error) {
    logger.warn(`Google Safe Browsing batch lookup failed: ${error.message}`);
    failGoogleItems(items, "exception");
  }
};

const flushGoogleBatches = async () => {
  googleBatchScheduled = false;
  const queued = pendingGoogleLookups;
  pendingGoogleLookups = [];
  const groups = new Map();
  for (const item of queued) {
    if (!groups.has(item.apiKey)) groups.set(item.apiKey, []);
    groups.get(item.apiKey).push(item);
  }

  const batches = [];
  for (const [apiKey, items] of groups.entries()) {
    let batch = [];
    for (const item of items) {
      const candidate = [...batch, item];
      if (batch.length > 0 && (
        candidate.length > GOOGLE_SAFE_BROWSING_BATCH_SIZE
        || googleRequestTargetBytes(candidate, apiKey) > GOOGLE_SAFE_BROWSING_REQUEST_TARGET_BYTES
      )) {
        batches.push(executeGoogleBatch(batch, apiKey));
        batch = [item];
      } else {
        batch = candidate;
      }
    }
    if (batch.length > 0) batches.push(executeGoogleBatch(batch, apiKey));
  }
  await Promise.all(batches);
};

const checkGoogleSafeBrowsing = (url) => {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  const result = createGoogleResult();

  if (!apiKey) {
    logger.debug("Google Safe Browsing API key not configured - skipping");
    result.reason = "api_key_missing";
    recordProviderState(result.source, result);
    return Promise.resolve(result);
  }

  return new Promise((resolve) => {
    pendingGoogleLookups.push({ url, apiKey, resolve });
    if (!googleBatchScheduled) {
      googleBatchScheduled = true;
      setImmediate(() => {
        flushGoogleBatches().catch((error) => {
          logger.warn(`Google Safe Browsing queue failed: ${error.message}`);
        });
      });
    }
  });
};

const checkVirusTotal = async (url, options = {}) => {
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
      if (!options.allowSubmission) {
        result.reason = "not_in_database";
        return result;
      }

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
  if (config.mode === "off" || config.mode === "local_only") {
    result.usage.push(providerUsage("external_threat_intel", "skipped", "external_mode_off"));
    return result;
  }

  const now = Date.now();
  const cacheKey = canonicalizeUrlCacheKey(url);
  let cached = null;
  try {
    cached = await readThreatIntelRecord(domain);
  } catch (error) {
    logger.warn(`Failed to read cached threat intel for ${domain}: ${error.message}`);
  }

  let safeBrowsingResult = {
    source: "google_safe_browsing",
    isMalicious: false,
    threatType: null,
    confidence: 0,
    status: "skipped",
    reason: "disabled",
  };
  let safeBrowsingCacheHit = false;

  if (config.googleEnabled) {
    const cachedGoogleResult = readFreshProviderCache(
      cached,
      "google_safe_browsing",
      cacheKey,
      now,
    );
    if (cachedGoogleResult) {
      safeBrowsingResult = cachedGoogleResult;
      safeBrowsingCacheHit = true;
      result.cacheHit = true;
      result.usage.push(providerUsage(
        "google_safe_browsing",
        "cache_hit",
        "fresh_url_cache",
        {
          cache_key: cacheKey,
          expires_at: cachedGoogleResult.cache_expires_at,
        },
      ));
    } else {
      safeBrowsingResult = await checkGoogleSafeBrowsing(url);
      result.usage.push(providerUsage(
        "google_safe_browsing",
        safeBrowsingResult.status || "queried",
        safeBrowsingResult.reason || "completed",
      ));
    }
  } else {
    result.usage.push(providerUsage("google_safe_browsing", "skipped", "disabled"));
  }

  let virusTotalResult = {
    source: "virustotal",
    isMalicious: false,
    threatType: null,
    confidence: 0,
    details: null,
    status: "skipped",
    reason: "disabled",
  };
  let virusTotalCacheHit = false;

  const vtDecision = shouldQueryVirusTotal({
    config,
    localScore: options.localScore,
    googleResult: safeBrowsingResult,
    internalThreatIntel: options.internalThreatIntel,
  });

  if (vtDecision.allowed) {
    const cachedVirusTotalResult = readFreshProviderCache(
      cached,
      "virustotal",
      cacheKey,
      now,
    );
    if (cachedVirusTotalResult) {
      virusTotalResult = cachedVirusTotalResult;
      virusTotalCacheHit = true;
      result.cacheHit = true;
      result.usage.push(providerUsage(
        "virustotal",
        "cache_hit",
        "fresh_url_cache",
        {
          cache_key: cacheKey,
          expires_at: cachedVirusTotalResult.cache_expires_at,
          gate_reason: vtDecision.reason,
        },
      ));
    } else {
      virusTotalResult = await checkVirusTotal(url, {
        allowSubmission: config.virusTotalAllowSubmission,
      });
      result.usage.push(providerUsage(
        "virustotal",
        virusTotalResult.status || "queried",
        virusTotalResult.reason || vtDecision.reason,
        { gate_reason: vtDecision.reason },
      ));
    }
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

  const newCacheEntries = [];
  if (!safeBrowsingCacheHit && cacheableProviderResult(safeBrowsingResult)) {
    const ttlMs = Number.isFinite(safeBrowsingResult.cacheDurationMs)
      ? safeBrowsingResult.cacheDurationMs
      : config.cacheTtlMs;
    if (ttlMs > 0) {
      newCacheEntries.push(buildProviderCacheEntry(
        safeBrowsingResult,
        cacheKey,
        ttlMs,
        now,
      ));
    }
  }
  if (!virusTotalCacheHit && cacheableProviderResult(virusTotalResult)) {
    newCacheEntries.push(buildProviderCacheEntry(
      virusTotalResult,
      cacheKey,
      config.cacheTtlMs,
      now,
    ));
  }

  const existingApiSources = Array.isArray(cached?.api_sources) ? cached.api_sources : [];
  const previewApiSources = mergeProviderCacheEntries(cached, newCacheEntries, now);
  const domainState = persistentDomainState(cached);
  const prunedEntries = existingApiSources.length !== previewApiSources.length
    || existingApiSources.some((entry) => !entry?.cache_key || !entry?.cache_expires_at);
  const shouldPersist = newCacheEntries.length > 0
    || domainState.needsCleanup
    || (Boolean(cached) && prunedEntries);

  if (shouldPersist) {
    await queueDomainCacheWrite(domain, newCacheEntries, now);
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
      api_version: "v5",
      usage: "non_commercial_only",
      configured: Boolean(gsbKey && gsbKey.length > 0),
      enabled: config.googleEnabled,
      ...providerState.google_safe_browsing,
    },
    virustotal: {
      api_version: "v3",
      configured: Boolean(vtKey && vtKey.length > 0),
      enabled: config.virusTotalEnabled,
      min_local_score: config.virusTotalMinLocalScore,
      allow_submission: config.virusTotalAllowSubmission,
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
