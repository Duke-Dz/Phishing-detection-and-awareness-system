const test = require("node:test");
const assert = require("node:assert/strict");
const { generateUnsubscribeToken, verifyUnsubscribeToken } = require("../../src/utils/unsubscribeTokens");

test("generateUnsubscribeToken creates a token for an email", () => {
  const email = "test@example.com";
  const token = generateUnsubscribeToken(email);
  assert.equal(typeof token, "string");
  assert.ok(token.length > 0);
});

test("verifyUnsubscribeToken returns true for a valid token", () => {
  const email = "user@domain.com";
  const token = generateUnsubscribeToken(email);
  assert.equal(verifyUnsubscribeToken(email, token), true);
});

test("verifyUnsubscribeToken returns false for an invalid token", () => {
  const email = "user@domain.com";
  const token = generateUnsubscribeToken(email);
  assert.equal(verifyUnsubscribeToken(email, token + "x"), false);
  assert.equal(verifyUnsubscribeToken("other@domain.com", token), false);
});
