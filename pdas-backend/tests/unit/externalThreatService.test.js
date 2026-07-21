process.env.NODE_ENV = "test";

const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const https = require("node:https");
const { ThreatIntelligence } = require("../../src/models");
const {
  checkExternalSources,
  checkGoogleSafeBrowsing,
  shouldQueryVirusTotal,
} = require("../../src/services/externalThreatService");

const envKeys = [
  "EXTERNAL_THREAT_MODE",
  "GOOGLE_SAFE_BROWSING_API_KEY",
  "GOOGLE_SAFE_BROWSING_ENABLED",
  "VIRUSTOTAL_ENABLED",
  "VIRUSTOTAL_MIN_LOCAL_SCORE",
];

test("VirusTotal default gate includes locally suspicious URLs", () => {
  const originalThreshold = process.env.VIRUSTOTAL_MIN_LOCAL_SCORE;
  const originalMode = process.env.EXTERNAL_THREAT_MODE;
  const originalEnabled = process.env.VIRUSTOTAL_ENABLED;
  delete process.env.VIRUSTOTAL_MIN_LOCAL_SCORE;
  process.env.EXTERNAL_THREAT_MODE = "gated";
  process.env.VIRUSTOTAL_ENABLED = "true";

  try {
    assert.equal(shouldQueryVirusTotal({ localScore: 24 }).allowed, false);
    assert.deepEqual(shouldQueryVirusTotal({ localScore: 25 }), {
      allowed: true,
      reason: "local_score_threshold",
    });
  } finally {
    if (originalThreshold === undefined) delete process.env.VIRUSTOTAL_MIN_LOCAL_SCORE;
    else process.env.VIRUSTOTAL_MIN_LOCAL_SCORE = originalThreshold;
    if (originalMode === undefined) delete process.env.EXTERNAL_THREAT_MODE;
    else process.env.EXTERNAL_THREAT_MODE = originalMode;
    if (originalEnabled === undefined) delete process.env.VIRUSTOTAL_ENABLED;
    else process.env.VIRUSTOTAL_ENABLED = originalEnabled;
  }
});

const makeRecord = (data) => {
  const record = { ...data };
  record.update = async (values) => {
    Object.assign(record, values);
    return record;
  };
  return record;
};

test("Safe Browsing cache is URL-scoped and honors v5 cacheDuration", async (t) => {
  const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  process.env.EXTERNAL_THREAT_MODE = "gated";
  process.env.GOOGLE_SAFE_BROWSING_API_KEY = "unit-test-key";
  process.env.GOOGLE_SAFE_BROWSING_ENABLED = "true";
  process.env.VIRUSTOTAL_ENABLED = "false";

  let databaseRecord = null;
  let requestCount = 0;

  t.after(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    t.mock.restoreAll();
  });

  t.mock.method(ThreatIntelligence, "findOne", async ({ where }) => (
    databaseRecord?.domain === where.domain ? databaseRecord : null
  ));
  t.mock.method(ThreatIntelligence, "create", async (data) => {
    databaseRecord = makeRecord(data);
    return databaseRecord;
  });
  t.mock.method(https, "request", (options, callback) => {
    requestCount += 1;
    const request = new EventEmitter();
    request.destroy = () => {};
    request.end = () => {
      setImmediate(() => {
        const response = new EventEmitter();
        response.statusCode = 200;
        callback(response);

        const requestUrl = new URL(options.path, "https://safebrowsing.googleapis.com");
        const queriedUrl = requestUrl.searchParams.get("urls");
        const pathname = new URL(queriedUrl).pathname;
        const body = pathname === "/malicious"
          ? {
            threats: [{
              url: "https://example.test/malicious",
              threatTypes: ["SOCIAL_ENGINEERING"],
            }],
            cacheDuration: "120s",
          }
          : {
            threats: [],
            cacheDuration: pathname === "/no-cache" ? "0s" : "120s",
          };

        response.emit("data", JSON.stringify(body));
        response.emit("end");
      });
    };
    return request;
  });

  const safeFirst = await checkExternalSources(
    "https://Example.test/safe#first-fragment",
    "example.test",
  );
  assert.equal(safeFirst.isMalicious, false);
  assert.equal(safeFirst.cacheHit, false);
  assert.equal(requestCount, 1);

  const safeEntry = databaseRecord.api_sources.find((entry) => (
    entry.source === "google_safe_browsing" && entry.cache_key.endsWith("/safe")
  ));
  assert.ok(safeEntry, "negative Safe Browsing results are cached");
  assert.equal(
    Date.parse(safeEntry.cache_expires_at) - Date.parse(safeEntry.cached_at),
    120_000,
  );

  const safeCached = await checkExternalSources(
    "https://example.test/safe#another-fragment",
    "example.test",
  );
  assert.equal(safeCached.isMalicious, false);
  assert.equal(safeCached.cacheHit, true);
  assert.equal(requestCount, 1);
  assert.ok(safeCached.usage.some((usage) => usage.reason === "fresh_url_cache"));

  const maliciousFirst = await checkExternalSources(
    "https://example.test/malicious",
    "example.test",
  );
  assert.equal(maliciousFirst.isMalicious, true);
  assert.equal(requestCount, 2, "a safe sibling path must not suppress a malicious lookup");
  assert.equal(databaseRecord.is_blacklisted, false);
  assert.equal(databaseRecord.reputation_score, 0);
  assert.deepEqual(databaseRecord.blacklist_sources, []);

  const safeAfterMalicious = await checkExternalSources(
    "https://example.test/safe",
    "example.test",
  );
  assert.equal(safeAfterMalicious.isMalicious, false);
  assert.equal(safeAfterMalicious.cacheHit, true);
  assert.equal(requestCount, 2, "a malicious path must not taint its safe sibling");

  const maliciousCached = await checkExternalSources(
    "https://example.test/malicious#ignored",
    "example.test",
  );
  assert.equal(maliciousCached.isMalicious, true);
  assert.equal(maliciousCached.cacheHit, true);
  assert.equal(requestCount, 2);

  await checkExternalSources("https://example.test/no-cache", "example.test");
  await checkExternalSources("https://example.test/no-cache", "example.test");
  assert.equal(requestCount, 4, "a zero cacheDuration must expire immediately");
});

test("concurrent same-domain results coalesce database cache reads and writes", async (t) => {
  const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  process.env.EXTERNAL_THREAT_MODE = "gated";
  process.env.GOOGLE_SAFE_BROWSING_API_KEY = "unit-test-key";
  process.env.GOOGLE_SAFE_BROWSING_ENABLED = "true";
  process.env.VIRUSTOTAL_ENABLED = "false";

  let databaseRecord = null;
  let findCount = 0;
  let createCount = 0;
  let requestCount = 0;

  t.after(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    t.mock.restoreAll();
  });

  t.mock.method(ThreatIntelligence, "findOne", async ({ where }) => {
    findCount += 1;
    await new Promise((resolve) => setImmediate(resolve));
    return databaseRecord?.domain === where.domain ? databaseRecord : null;
  });
  t.mock.method(ThreatIntelligence, "create", async (data) => {
    createCount += 1;
    if (databaseRecord) {
      const error = new Error("duplicate domain");
      error.name = "SequelizeUniqueConstraintError";
      throw error;
    }
    databaseRecord = makeRecord(data);
    return databaseRecord;
  });
  t.mock.method(https, "request", (options, callback) => {
    requestCount += 1;
    const request = new EventEmitter();
    request.destroy = () => {};
    request.end = () => {
      setImmediate(() => {
        const response = new EventEmitter();
        response.statusCode = 200;
        callback(response);
        response.emit("data", JSON.stringify({ threats: [], cacheDuration: "120s" }));
        response.emit("end");
      });
    };
    return request;
  });

  const urls = Array.from({ length: 7 }, (_value, index) => `https://c.gle/path-${index}`);
  const results = await Promise.all(urls.map((url) => checkExternalSources(url, "c.gle")));

  assert.equal(results.every((result) => result.isMalicious === false), true);
  assert.equal(requestCount, 1, "Safe Browsing requests remain batched");
  assert.equal(createCount, 1, "the domain cache row is created once");
  assert.ok(findCount <= 2, `expected at most two coalesced reads, received ${findCount}`);
  assert.deepEqual(
    databaseRecord.api_sources.map((entry) => entry.cache_key).sort(),
    urls.slice().sort(),
  );
});

test("legacy provider-only domain taint is removed while URL results stay scoped", async (t) => {
  const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  process.env.EXTERNAL_THREAT_MODE = "gated";
  process.env.GOOGLE_SAFE_BROWSING_API_KEY = "unit-test-key";
  process.env.GOOGLE_SAFE_BROWSING_ENABLED = "true";
  process.env.VIRUSTOTAL_ENABLED = "false";

  const legacyRecord = makeRecord({
    domain: "legacy.test",
    is_blacklisted: true,
    reputation_score: 90,
    blacklist_sources: ["google_safe_browsing"],
    threat_type: "phishing",
    api_sources: [{
      source: "google_safe_browsing",
      isMalicious: true,
      status: "queried",
      reason: "matched",
    }],
    last_checked: new Date(),
  });

  t.after(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    t.mock.restoreAll();
  });

  t.mock.method(ThreatIntelligence, "findOne", async () => legacyRecord);
  t.mock.method(https, "request", (_options, callback) => {
    const request = new EventEmitter();
    request.destroy = () => {};
    request.end = () => {
      setImmediate(() => {
        const response = new EventEmitter();
        response.statusCode = 200;
        callback(response);
        response.emit("data", JSON.stringify({ threats: [], cacheDuration: "60s" }));
        response.emit("end");
      });
    };
    return request;
  });

  const result = await checkExternalSources("https://legacy.test/safe", "legacy.test");
  assert.equal(result.isMalicious, false);
  assert.equal(legacyRecord.is_blacklisted, false);
  assert.equal(legacyRecord.reputation_score, 0);
  assert.equal(legacyRecord.threat_type, "unknown");
  assert.deepEqual(legacyRecord.blacklist_sources, []);
  assert.equal(legacyRecord.api_sources.length, 1);
  assert.equal(legacyRecord.api_sources[0].cache_key, "https://legacy.test/safe");
});

test("Safe Browsing coalesces more than eight URLs into one v5 batch", async (t) => {
  const originalKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  process.env.GOOGLE_SAFE_BROWSING_API_KEY = "unit-test-key";
  let requestCount = 0;
  let requestedUrls = [];

  t.after(() => {
    if (originalKey === undefined) delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    else process.env.GOOGLE_SAFE_BROWSING_API_KEY = originalKey;
    t.mock.restoreAll();
  });

  t.mock.method(https, "request", (options, callback) => {
    requestCount += 1;
    const request = new EventEmitter();
    request.destroy = () => {};
    request.end = () => {
      setImmediate(() => {
        const requestUrl = new URL(options.path, "https://safebrowsing.googleapis.com");
        requestedUrls = requestUrl.searchParams.getAll("urls");
        const response = new EventEmitter();
        response.statusCode = 200;
        callback(response);
        response.emit("data", JSON.stringify({
          threats: [{
            url: requestedUrls[10],
            threatTypes: ["SOCIAL_ENGINEERING"],
          }, {
            url: "https://expression.example/path",
            threatTypes: ["MALWARE"],
          }],
          cacheDuration: "60s",
        }));
        response.emit("end");
      });
    };
    return request;
  });

  const urls = Array.from({ length: 12 }, (_value, index) => (
    `https://batch${index}.example/path`
  ));
  urls[11] = "https://sub.expression.example/path/deeper";
  const results = await Promise.all(urls.map((url) => checkGoogleSafeBrowsing(url)));

  assert.equal(requestCount, 1);
  assert.deepEqual(requestedUrls, urls);
  assert.equal(results[10].isMalicious, true);
  assert.equal(results[11].isMalicious, true);
  assert.equal(results.filter((result) => result.isMalicious).length, 2);
});

test("Safe Browsing batches respect a request-target byte budget", async (t) => {
  const originalKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  process.env.GOOGLE_SAFE_BROWSING_API_KEY = "unit-test-key";
  const requestTargets = [];

  t.after(() => {
    if (originalKey === undefined) delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    else process.env.GOOGLE_SAFE_BROWSING_API_KEY = originalKey;
    t.mock.restoreAll();
  });

  t.mock.method(https, "request", (options, callback) => {
    requestTargets.push(options.path);
    const request = new EventEmitter();
    request.destroy = () => {};
    request.end = () => {
      setImmediate(() => {
        const response = new EventEmitter();
        response.statusCode = 200;
        callback(response);
        response.emit("data", JSON.stringify({ threats: [], cacheDuration: "60s" }));
        response.emit("end");
      });
    };
    return request;
  });

  const longUrls = Array.from({ length: 3 }, (_value, index) => (
    `https://long${index}.example/${"a".repeat(3000)}`
  ));
  const results = await Promise.all(longUrls.map((url) => checkGoogleSafeBrowsing(url)));
  assert.equal(results.every((result) => result.status === "queried"), true);
  assert.equal(requestTargets.length, 2);
  assert.equal(requestTargets.every((target) => Buffer.byteLength(target, "utf8") <= 7000), true);

  const requestsBeforeOversize = requestTargets.length;
  const oversized = await checkGoogleSafeBrowsing(
    `https://oversized.example/${"b".repeat(8000)}`,
  );
  assert.equal(oversized.status, "failed");
  assert.equal(oversized.reason, "request_target_too_large");
  assert.equal(requestTargets.length, requestsBeforeOversize);
});

test("Safe Browsing splits and retries a rejected multi-URL request", async (t) => {
  const originalKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  process.env.GOOGLE_SAFE_BROWSING_API_KEY = "unit-test-key";
  let requestCount = 0;

  t.after(() => {
    if (originalKey === undefined) delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    else process.env.GOOGLE_SAFE_BROWSING_API_KEY = originalKey;
    t.mock.restoreAll();
  });

  t.mock.method(https, "request", (_options, callback) => {
    requestCount += 1;
    const currentRequest = requestCount;
    const request = new EventEmitter();
    request.destroy = () => {};
    request.end = () => {
      setImmediate(() => {
        const response = new EventEmitter();
        response.statusCode = currentRequest === 1 ? 414 : 200;
        callback(response);
        response.emit("data", currentRequest === 1
          ? ""
          : JSON.stringify({ threats: [], cacheDuration: "60s" }));
        response.emit("end");
      });
    };
    return request;
  });

  const results = await Promise.all([
    checkGoogleSafeBrowsing("https://retry-one.example/path"),
    checkGoogleSafeBrowsing("https://retry-two.example/path"),
  ]);
  assert.equal(requestCount, 3);
  assert.equal(results.every((result) => result.status === "queried"), true);
});
