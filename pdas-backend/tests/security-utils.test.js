const test = require("node:test");
const assert = require("node:assert/strict");
const { generateMfaSecret, generateTotp, verifyTotp } = require("../src/utils/mfa");
const { buildPaginationMeta, getPagination } = require("../src/utils/pagination");

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
