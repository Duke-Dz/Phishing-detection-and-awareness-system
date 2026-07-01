const test = require("node:test");
const assert = require("node:assert/strict");
const { generateToken, hashToken } = require("../../src/utils/tokenGenerator");

test("generateToken creates a hex string of default 32 bytes (64 chars)", () => {
  const token = generateToken();
  assert.equal(typeof token, "string");
  assert.equal(token.length, 64);
  assert.match(token, /^[0-9a-f]{64}$/i);
});

test("generateToken creates a hex string of specified byte length", () => {
  const token = generateToken(16);
  assert.equal(token.length, 32);
});

test("hashToken returns a consistent SHA-256 hex string", () => {
  const input = "test_token";
  const hash1 = hashToken(input);
  const hash2 = hashToken(input);
  assert.equal(hash1, hash2);
  assert.equal(hash1.length, 64);
  assert.match(hash1, /^[0-9a-f]{64}$/i);
});
