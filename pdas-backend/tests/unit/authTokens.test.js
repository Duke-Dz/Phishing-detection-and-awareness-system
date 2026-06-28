const test = require("node:test");
const assert = require("node:assert/strict");

let createCalls = [];
let updateCalls = [];

const mockRefreshToken = {
  create: async (data) => {
    createCalls.push(data);
    return data;
  },
  update: async (data, conditions) => {
    updateCalls.push({ data, conditions });
    return [1];
  }
};

const mockSequelize = {
  transaction: async (cb) => {
    return await cb({}); // pass dummy transaction object
  }
};

const proxyquire = require("node:module").createRequire(__filename);
const originalRequire = require("node:module").prototype.require;
require("node:module").prototype.require = function(path) {
  if (path === "../models") {
    return { RefreshToken: mockRefreshToken, User: {} };
  }
  if (path === "../config/sequelize") {
    return { sequelize: mockSequelize };
  }
  return originalRequire.apply(this, arguments);
};

const {
  issueTokenPair,
  revokeRefreshToken,
  revokeUserRefreshTokens,
  signAccessToken,
} = require("../../src/utils/authTokens");

require("node:module").prototype.require = originalRequire;

test("signAccessToken returns a JWT string", () => {
  process.env.JWT_SECRET = "test-secret";
  const user = { user_id: "u1", role: "user" };
  const token = signAccessToken(user);
  assert.equal(typeof token, "string");
  assert.ok(token.split(".").length === 3);
});

test("issueTokenPair creates a RefreshToken and returns pair", async () => {
  createCalls.length = 0;
  process.env.JWT_SECRET = "test-secret";
  const user = { user_id: "u1", role: "user" };
  
  const pair = await issueTokenPair(user);
  
  assert.ok(pair.token);
  assert.ok(pair.refreshToken);
  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0].user_id, "u1");
  assert.ok(createCalls[0].token_hash);
});

test("revokeRefreshToken updates token as revoked", async () => {
  updateCalls.length = 0;
  const result = await revokeRefreshToken("some-token");
  assert.equal(result, 1);
  assert.equal(updateCalls.length, 1);
  assert.ok(updateCalls[0].data.revoked_at);
  assert.ok(updateCalls[0].conditions.where.token_hash);
});

test("revokeUserRefreshTokens updates user's tokens as revoked", async () => {
  updateCalls.length = 0;
  const result = await revokeUserRefreshTokens("user-1");
  assert.equal(result, 1);
  assert.equal(updateCalls.length, 1);
  assert.ok(updateCalls[0].data.revoked_at);
  assert.equal(updateCalls[0].conditions.where.user_id, "user-1");
});
