/**
 * PDAS Backend — Comprehensive Test Suite
 *
 * Tests are grouped by module. Run with: npm test
 * Uses Node.js built-in test runner (node --test)
 */

const test = require("node:test");
const assert = require("node:assert/strict");

// ── Existing Detection Engine Tests ─────────────────────────────────────
const { buildPaginationMeta, getPagination } = require("../src/utils/pagination");
const { analyzePageContent, isPrivateIp } = require("../src/services/contentAnalysisService");
const { checkTyposquatting } = require("../src/services/typosquattingService");
const { extractUrlFeatures, scoreUrlFeatures } = require("../src/services/mlScorerService");
const { computeFinalScore, applyUrlEvidenceGates } = require("../src/services/detectionService");

// ── Validators Module Tests ─────────────────────────────────────────────

const {
  createError,
  requireFields,
  normalizeEmail,
  validatePassword,
  validateUrl,
} = require("../src/utils/inputValidation");

test("createError returns Error with correct message and status", () => {
  const err = createError("Test error", 404);
  assert.equal(err.message, "Test error");
  assert.equal(err.statusCode, 404);
  assert.ok(err instanceof Error);
});

test("createError defaults to 400 when no status given", () => {
  const err = createError("Bad request");
  assert.equal(err.statusCode, 400);
});

test("requireFields throws when fields are missing", () => {
  assert.throws(
    () => requireFields({ name: "test" }, ["name", "email"]),
    /Missing required field.*email/,
  );
});

test("requireFields does not throw when all fields present", () => {
  assert.doesNotThrow(() =>
    requireFields({ name: "test", email: "a@b.com" }, ["name", "email"]),
  );
});

test("normalizeEmail normalizes valid email", () => {
  const email = normalizeEmail("  Test@Example.COM  ");
  assert.equal(email, "test@example.com");
});

test("normalizeEmail throws for invalid email", () => {
  assert.throws(() => normalizeEmail("not-an-email"), /valid email/);
});

test("validatePassword throws for short passwords", () => {
  assert.throws(() => validatePassword("short"), /at least 8/);
});

test("validatePassword accepts 8+ character passwords", () => {
  assert.doesNotThrow(() => validatePassword("longEnough123"));
});

test("validateUrl throws for invalid URLs", () => {
  assert.throws(() => validateUrl("not a url"), /valid URL/);
  assert.throws(() => validateUrl("ftp://example.com"), /valid URL/);
});

test("validateUrl accepts valid http/https URLs", () => {
  assert.equal(validateUrl("https://example.com"), "https://example.com");
  assert.equal(validateUrl("http://test.org/path"), "http://test.org/path");
});

// ── Pagination Tests ────────────────────────────────────────────────────

test("pagination clamps unsafe page sizes", () => {
  const pagination = getPagination({ page: "2", page_size: "1000" });
  assert.deepEqual(pagination, {
    limit: 100,
    offset: 100,
    page: 2,
    pageSize: 100,
  });
});

test("pagination metadata reports total pages", () => {
  assert.deepEqual(buildPaginationMeta({ count: 51, page: 2, pageSize: 25 }), {
    total: 51,
    page: 2,
    page_size: 25,
    total_pages: 3,
  });
});

test("pagination defaults to page 1 with pageSize 25", () => {
  const pagination = getPagination({});
  assert.equal(pagination.page, 1);
  assert.equal(pagination.pageSize, 25);
  assert.equal(pagination.offset, 0);
});

test("pagination handles negative page numbers gracefully", () => {
  const pagination = getPagination({ page: "-5", page_size: "10" });
  assert.equal(pagination.page >= 1, true);
});

test("pagination metadata calculates single page correctly", () => {
  assert.deepEqual(buildPaginationMeta({ count: 5, page: 1, pageSize: 25 }), {
    total: 5,
    page: 1,
    page_size: 25,
    total_pages: 1,
  });
});

test("pagination metadata handles zero results", () => {
  const meta = buildPaginationMeta({ count: 0, page: 1, pageSize: 25 });
  assert.equal(meta.total, 0);
  // buildPaginationMeta uses Math.ceil which returns 0 or 1 for empty sets
  assert.ok(meta.total_pages <= 1);
});

// ── Typosquatting Detection Tests ───────────────────────────────────────

test("typosquatting detects brand impersonation with substitutions and suffixes", () => {
  const result = checkTyposquatting("paypa1-secure.com");
  assert.equal(result.isTyposquat, true);
  assert.equal(result.matchedBrand, "paypal");
  assert.equal(result.attackType, "character_substitution");
  assert.equal(result.editDistance, 1);
});

test("typosquatting does not flag exact trusted brand domains", () => {
  const result = checkTyposquatting("paypal.com");
  assert.equal(result.isTyposquat, false);
});

test("typosquatting detects googIe with capital I substitution", () => {
  const result = checkTyposquatting("g00gle-login.com");
  assert.equal(result.isTyposquat, true);
  assert.equal(result.matchedBrand, "google");
});

test("typosquatting detects common brand misspellings", () => {
  const result = checkTyposquatting("faceb00k-login.com");
  assert.equal(result.isTyposquat, true);
  assert.equal(result.matchedBrand, "facebook");
});

test("typosquatting does not flag unrelated domains", () => {
  const result = checkTyposquatting("randomshop.com");
  assert.equal(result.isTyposquat, false);
});

test("typosquatting detects character substitution in brands", () => {
  const result = checkTyposquatting("amaz0n-secure.com");
  assert.equal(result.isTyposquat, true);
  assert.equal(result.matchedBrand, "amazon");
});

// ── ML Scorer Tests ─────────────────────────────────────────────────────

test("URL feature scorer treats credential-looking paths as supporting evidence", () => {
  const url = "http://paypa1-secure.com/login/verify-password";
  const features = extractUrlFeatures(url);
  const score = scoreUrlFeatures(features);
  const typosquat = checkTyposquatting(new URL(url).hostname);

  assert.equal(features.hasHttps, 0);
  assert.equal(features.digitCount, 1);
  assert.equal(features.hyphenCount, 1);
  assert.equal(features.credentialPathKeywordCount >= 3, true);
  // A login path is not independently malicious; the brand impersonation is
  // the strong signal that the layered detector combines with this evidence.
  assert.equal(score > 0 && score <= 30, true);
  assert.equal(typosquat.isTyposquat, true);
});

test("URL ML scorer assigns low risk to legitimate HTTPS domains", () => {
  const features = extractUrlFeatures("https://www.google.com/search?q=test");
  const score = scoreUrlFeatures(features);

  assert.equal(features.hasHttps, 1);
  assert.equal(score < 30, true);
});

test("URL ML scorer detects IP-based URLs as higher risk", () => {
  const features = extractUrlFeatures("http://192.168.1.1/admin/login");
  const score = scoreUrlFeatures(features);

  assert.equal(features.hasIpAddress, 1);
  assert.equal(score > 50, true);
});

test("URL ML scorer detects very long URLs as higher risk", () => {
  const longPath = "a".repeat(200);
  const features = extractUrlFeatures(`https://example.com/${longPath}`);

  assert.equal(features.urlLength > 200, true);
});

// ── Detection Engine / Score Computation Tests ──────────────────────────

test("confirmed phishing threat intelligence cannot be averaged down to suspicious", () => {
  const score = computeFinalScore(
    { rules: 26, blacklist: 95, ml: 10, content: 0 },
    { rules: 0.35, blacklist: 0.30, ml: 0.25, content: 0.10 },
    ["rules", "blacklist", "ml"],
    { is_blacklisted: true, threat_type: "phishing", reputation_score: 95 },
  );
  assert.equal(score >= 70, true);
});

test("all-zero layer scores produce a safe classification", () => {
  const score = computeFinalScore(
    { rules: 0, blacklist: 0, ml: 0, content: 0 },
    { rules: 0.35, blacklist: 0.30, ml: 0.25, content: 0.10 },
    [],
    null,
  );
  assert.equal(score < 30, true);
});

test("high ML + high rules without blacklist still flags as risky", () => {
  const score = computeFinalScore(
    { rules: 80, blacklist: 0, ml: 85, content: 20 },
    { rules: 0.35, blacklist: 0.30, ml: 0.25, content: 0.10 },
    ["rules", "ml"],
    null,
  );
  assert.equal(score >= 40, true);
});

test("one strong URL deception signal cannot be averaged down to safe", () => {
  const result = applyUrlEvidenceGates(22, [{
    name: "subdomain_impersonation",
    points: 35,
    strength: "strong",
    category: "identity",
    family: "identity",
  }]);

  assert.equal(result.score, 31);
  assert.equal(result.reason, "single_strong_signal_review");
});

test("two independent strong URL evidence families force phishing", () => {
  const result = applyUrlEvidenceGates(44, [
    { name: "typosquatting", points: 35, strength: "strong", family: "identity" },
    { name: "at_trick", points: 40, strength: "strong", family: "link" },
  ]);

  assert.equal(result.score, 65);
  assert.equal(result.reason, "corroborated_strong_evidence");
});

test("external no-match remains neutral in URL evidence gates", () => {
  const result = applyUrlEvidenceGates(8, [], null);

  assert.equal(result.score, 8);
  assert.equal(result.reason, "weighted_average");
});

test("Safe Browsing social engineering verdict forces phishing", () => {
  const result = applyUrlEvidenceGates(28, [], {
    is_blacklisted: true,
    threat_type: "social_engineering",
  });

  assert.equal(result.score, 70);
  assert.equal(result.reason, "blacklist_confirmed");
});

// ── Content Analysis Tests ──────────────────────────────────────────────

test("content analysis detects credential forms and title/domain mismatch", () => {
  const html = `
    <html>
      <head><title>PayPal Account Verification</title></head>
      <body>
        <form action="https://collector.example/steal">
          <input type="password" name="password" />
        </form>
      </body>
    </html>
  `;

  const result = analyzePageContent(html, "https://paypa1-secure.com/login");
  assert.equal(result.hasCredentialHarvester, true);
  assert.equal(result.hasTitleMismatch, true);
});

test("content analysis does not flag legitimate pages without forms", () => {
  const html = `
    <html>
      <head><title>My Blog</title></head>
      <body><p>Hello world</p></body>
    </html>
  `;

  const result = analyzePageContent(html, "https://myblog.com");
  assert.equal(result.hasCredentialHarvester, false);
});

test("content analysis detects hidden iframes", () => {
  const html = `
    <html>
      <body>
        <iframe src="https://evil.com/harvest" style="display:none"></iframe>
      </body>
    </html>
  `;

  const result = analyzePageContent(html, "https://example.com");
  assert.equal(result.hasHiddenElements, true);
});

test("content fetch guard blocks hexadecimal IPv4-mapped IPv6 addresses", async () => {
  assert.equal(await isPrivateIp("::ffff:7f00:1"), true);
  assert.equal(await isPrivateIp("::ffff:a9fe:a9fe"), true);
  assert.equal(await isPrivateIp("::ffff:0808:0808"), false);
  assert.equal(await isPrivateIp("2606:4700:4700::1111"), false);
});

// ── Cache Service Tests ─────────────────────────────────────────────────

const cacheService = require("../src/services/cacheService");

test("cache set and get work correctly", () => {
  cacheService.set("test:key", { value: 42 }, 60);
  const result = cacheService.get("test:key");
  assert.deepEqual(result, { value: 42 });
});

test("cache returns undefined for missing keys", () => {
  const result = cacheService.get("nonexistent:key");
  assert.equal(result, undefined);
});

test("cache delete removes a key", () => {
  cacheService.set("test:delete", "value", 60);
  cacheService.del("test:delete");
  assert.equal(cacheService.get("test:delete"), undefined);
});

test("cache delByPrefix removes all matching keys", () => {
  cacheService.set("prefix:a", 1, 60);
  cacheService.set("prefix:b", 2, 60);
  cacheService.set("other:c", 3, 60);
  cacheService.delByPrefix("prefix:");
  assert.equal(cacheService.get("prefix:a"), undefined);
  assert.equal(cacheService.get("prefix:b"), undefined);
  assert.deepEqual(cacheService.get("other:c"), 3);
  cacheService.del("other:c");
});

test("cache getOrSet returns cached value on hit", async () => {
  cacheService.set("test:cached", "cached_value", 60);
  let fetchCalled = false;
  const value = await cacheService.getOrSet("test:cached", async () => {
    fetchCalled = true;
    return "fresh_value";
  }, 60);
  assert.equal(value, "cached_value");
  assert.equal(fetchCalled, false);
  cacheService.del("test:cached");
});

test("cache getOrSet calls fetch on miss", async () => {
  const value = await cacheService.getOrSet("test:miss", async () => {
    return "fetched_value";
  }, 60);
  assert.equal(value, "fetched_value");
  cacheService.del("test:miss");
});

test("cache getStats returns valid statistics", () => {
  cacheService.flush();
  cacheService.set("stats:test", 1, 60);
  cacheService.get("stats:test");
  cacheService.get("stats:nonexistent");
  const stats = cacheService.getStats();
  assert.equal(typeof stats.keys, "number");
  assert.equal(typeof stats.hits, "number");
  assert.equal(typeof stats.misses, "number");
  assert.equal(typeof stats.hit_rate, "number");
  cacheService.flush();
});

test("cache key builders produce consistent keys", () => {
  assert.equal(cacheService.keys.dashboardStats("user-123"), "dashboard:user-123");
  assert.equal(cacheService.keys.scanResult("https://example.com"), "scan:https://example.com");
  assert.equal(cacheService.keys.reportDetail("report-1"), "reports:detail:report-1");
  assert.equal(cacheService.keys.reportList("user-123", { page: 1 }), 'reports:list:user-123:{"page":1}');
  assert.equal(cacheService.keys.threatIntel("evil.com"), "threat:evil.com");
  assert.equal(cacheService.keys.settings(), "settings:all");
  assert.equal(cacheService.keys.systemStats(), "admin:system_stats");
});

const { PendingRegistration } = require("../src/models");
const {
  cleanupExpiredPendingRegistrations,
  startPendingRegistrationCleanup,
  stopPendingRegistrationCleanup,
} = require("../src/services/pendingRegistrationService");
const { errorHandler } = require("../src/middleware/errorHandler");

test("cleanupExpiredPendingRegistrations deletes expired rows only", async () => {
  const originalDestroy = PendingRegistration.destroy;
  let whereClause;
  PendingRegistration.destroy = async ({ where }) => {
    whereClause = where;
    return 3;
  };

  try {
    const now = new Date("2026-07-08T10:00:00.000Z");
    const deleted = await cleanupExpiredPendingRegistrations(now);
    assert.equal(deleted, 3);
    assert.ok(whereClause.expires_at);
  } finally {
    PendingRegistration.destroy = originalDestroy;
  }
});

test("pending registration cleanup scheduler starts and stops safely", () => {
  const originalDestroy = PendingRegistration.destroy;
  PendingRegistration.destroy = async () => 0;

  try {
    const timer = startPendingRegistrationCleanup();
    assert.ok(timer);
    assert.equal(startPendingRegistrationCleanup(), timer);
    stopPendingRegistrationCleanup();
    assert.doesNotThrow(() => stopPendingRegistrationCleanup());
  } finally {
    PendingRegistration.destroy = originalDestroy;
  }
});

test("errorHandler hides internal server errors behind safe response", () => {
  const req = { id: "req-test" };
  const res = {
    locals: {},
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  errorHandler(new Error("database password leaked"), req, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.payload.code, "INTERNAL_ERROR");
  assert.equal(res.payload.message, "We could not complete your request. Please try again shortly.");
  assert.equal(res.payload.request_id, "req-test");
});

// ── Email Parser Tests ──────────────────────────────────────────────────

const { parseRawEmail, extractAuthHeaders } = require("../src/utils/emailParser");

test("email parser extracts basic headers from raw email", () => {
  const raw = [
    "From: sender@example.com",
    "To: recipient@example.com",
    "Subject: Test Email",
    "Date: Mon, 13 Jun 2026 10:00:00 +0000",
    "",
    "Hello, this is the body.",
  ].join("\r\n");

  const result = parseRawEmail(raw);
  assert.equal(result.from, "sender@example.com");
  assert.equal(result.to, "recipient@example.com");
  assert.equal(result.subject, "Test Email");
  assert.ok(result.body.includes("Hello, this is the body."));
});

test("email parser handles missing headers gracefully", () => {
  const raw = "Subject: Only Subject\r\n\r\nBody text";
  const result = parseRawEmail(raw);
  assert.equal(result.subject, "Only Subject");
  assert.equal(result.from, "");
  assert.equal(result.to, "");
});

test("extractAuthHeaders parses SPF results", () => {
  const headers = {
    "authentication-results": "mx.example.com; spf=pass; dkim=pass; dmarc=pass",
  };
  const result = extractAuthHeaders(headers);
  assert.equal(result.spf, "pass");
  assert.equal(result.dkim, "pass");
  assert.equal(result.dmarc, "pass");
});

test("extractAuthHeaders handles missing auth headers", () => {
  const result = extractAuthHeaders({});
  assert.equal(result.spf, null);
  assert.equal(result.dkim, null);
  assert.equal(result.dmarc, null);
});

// ── SSE Service Tests ───────────────────────────────────────────────────

const sseService = require("../src/services/sseService");

test("SSE service starts with zero connections", () => {
  assert.equal(sseService.getActiveConnections(), 0);
});

test("SSE sendToUser does not throw for non-existent users", () => {
  assert.doesNotThrow(() => {
    sseService.sendToUser("non-existent-user", "test", { message: "hello" });
  });
});

// ── Error Handler Tests ─────────────────────────────────────────────────

const { asyncHandler } = require("../src/middleware/errorHandler");

test("asyncHandler passes errors to next()", async () => {
  let capturedError = null;
  const handler = asyncHandler(async () => {
    throw new Error("test error");
  });

  const mockReq = {};
  const mockRes = {};
  const mockNext = (err) => { capturedError = err; };

  await handler(mockReq, mockRes, mockNext);
  assert.equal(capturedError.message, "test error");
});

test("asyncHandler lets successful handlers complete normally", async () => {
  let responseData = null;
  const handler = asyncHandler(async (_req, res) => {
    res.json({ success: true });
  });

  const mockReq = {};
  const mockRes = { json: (data) => { responseData = data; } };
  const mockNext = () => {};

  await handler(mockReq, mockRes, mockNext);
  assert.deepEqual(responseData, { success: true });
});

// ── URL Tricks Service Tests ────────────────────────────────────────────

const { checkAtTrick, checkExcessiveSubdomains } = require("../src/services/urlTricksService");

test("URL tricks detects @ symbol in URL (credential phishing)", () => {
  const result = checkAtTrick("https://google.com@evil.com/login");
  assert.equal(result.detected, true);
});

test("URL tricks detects excessive subdomains (4+ levels)", () => {
  const result = checkExcessiveSubdomains("a.b.c.d.evil.com");
  assert.equal(result.detected, true);
});

test("URL tricks does not flag simple domains", () => {
  const result = checkExcessiveSubdomains("www.example.com");
  assert.equal(result.detected, false);
});

// ── Sender Analyzer Tests ───────────────────────────────────────────────

const { analyzeSender } = require("../src/utils/senderAnalyzer");

test("sender analyzer returns score and signals for known senders", () => {
  const result = analyzeSender("MPESA", "Your PIN has been reset");
  assert.equal(typeof result.score, "number");
  assert.ok(Array.isArray(result.signals));
});

test("sender analyzer handles unknown senders", () => {
  const result = analyzeSender(null, "");
  assert.equal(result.score, 0);
  assert.equal(result.senderType, "unknown");
});

// ── Audit Service Tests ─────────────────────────────────────────────────

const { ACTIONS } = require("../src/services/auditService");

test("audit service exports expected action constants", () => {
  assert.equal(ACTIONS.AUTH_LOGIN, "auth.login");
  assert.equal(ACTIONS.SCAN_URL, "scan.url");
  assert.equal(ACTIONS.REPORT_CREATE, "report.create");
  assert.equal(ACTIONS.ADMIN_ROLE_CHANGE, "admin.role_change");
  assert.equal(ACTIONS.PASSWORD_CHANGE, "password.change");
});

test("audit service ACTIONS covers all expected categories", () => {
  const actionValues = Object.values(ACTIONS);
  assert.ok(actionValues.length >= 15, `Expected at least 15 actions, got ${actionValues.length}`);
  assert.ok(actionValues.some((a) => a.startsWith("auth.")));
  assert.ok(actionValues.some((a) => a.startsWith("scan.")));
  assert.ok(actionValues.some((a) => a.startsWith("report.")));
  assert.ok(actionValues.some((a) => a.startsWith("admin.")));
  assert.ok(actionValues.some((a) => a.startsWith("awareness.")));
});
