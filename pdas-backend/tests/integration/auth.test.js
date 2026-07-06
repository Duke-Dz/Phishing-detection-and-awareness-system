const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { createAgent, mockDb } = require("./helpers/setup");
const crypto = require("crypto");
const { hashToken } = require("../../src/utils/tokenGenerator");

const getRefreshCookie = (res) => {
  const setCookie = res.headers.get("set-cookie") || "";
  const match = setCookie.match(/refresh_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
};

test("Auth Endpoints", async (t) => {
  let agent;
  let testUser;
  let testPassword = "Password123!";
  let testPasswordHash;

  t.before(async () => {
    agent = await createAgent();
    testPasswordHash = await bcrypt.hash(testPassword, 10);
    testUser = {
      user_id: "test-user-id",
      email: "test@example.com",
      username: "testuser",
      full_name: "Test User",
      password_hash: testPasswordHash,
      role: "user",
      is_active: true,
      email_verified: true,
    };
    mockDb.User.records = [testUser];
  });

  t.after(async () => {
    await agent.close();
  });

  await t.test("POST /api/auth/register", async () => {
    const res = await agent.post("/api/auth/register", {
      body: {
        username: "newuser",
        full_name: "New User",
        email: "new@example.com",
        password: "NewPassword123!"
      }
    });
    // Register uses PendingRegistration and sends email, returns 201
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.match(res.body.message, /verification email/i);
    assert.equal(res.body.resend_available_in, 120);
    assert.equal(mockDb.PendingRegistration.records.at(-1).username, "newuser");
  });

  await t.test("POST /api/auth/login", async () => {
    const res = await agent.post("/api/auth/login", {
      body: {
        identifier: "test@example.com",
        password: testPassword
      }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.token);
    assert.equal(res.body.refreshToken, undefined);
    assert.ok(getRefreshCookie(res));
    assert.equal(res.body.data.username, "testuser");
    assert.equal(res.body.data.mfa_enabled, undefined);
    assert.equal(res.body.data.mfa_secret, undefined);
  });

  await t.test("POST /api/auth/login rejects a username identifier", async () => {
    const res = await agent.post("/api/auth/login", {
      body: {
        identifier: "testuser",
        password: testPassword
      }
    });
    assert.equal(res.status, 400);
  });

  await t.test("removed MFA endpoints return 404", async () => {
    for (const path of ["/api/auth/mfa/setup", "/api/auth/mfa/enable", "/api/auth/mfa/disable"]) {
      const res = await agent.post(path, { body: {} });
      assert.equal(res.status, 404);
    }
  });

  await t.test("POST /api/auth/forgot-password enforces the server resend cooldown", async () => {
    const first = await agent.post("/api/auth/forgot-password", {
      body: { email: testUser.email }
    });

    assert.equal(first.status, 200);
    assert.equal(first.body.success, true);
    assert.equal(first.body.resend_available_in, 60);
    assert.match(first.body.message, /if that email is registered/i);

    const repeated = await agent.post("/api/auth/forgot-password", {
      body: { email: testUser.email }
    });

    assert.equal(repeated.status, 429);
    assert.equal(repeated.body.code, "RATE_LIMITED");
    assert.ok(repeated.body.retry_after_seconds > 0);
    assert.ok(repeated.body.retry_after_seconds <= 60);
  });

  await t.test("POST /api/auth/resend-verification enforces a two-minute cooldown", async () => {
    mockDb.PendingRegistration.records = [{
      email: "cooldown@example.com",
      username: "cooldownuser",
      full_name: "Cooldown User",
      password_hash: testPasswordHash,
      verification_token_hash: hashToken("existing-verification-token"),
      expires_at: new Date(Date.now() + 60_000),
      updated_at: new Date(),
    }];

    const res = await agent.post("/api/auth/resend-verification", {
      body: { email: "cooldown@example.com" }
    });

    assert.equal(res.status, 429);
    assert.equal(res.body.code, "VERIFICATION_RESEND_COOLDOWN");
    assert.ok(res.body.retry_after_seconds > 0);
    assert.ok(res.body.retry_after_seconds <= 120);
  });

  await t.test("POST /api/auth/resend-verification rotates the link token", async () => {
    const oldHash = hashToken("old-verification-token");
    const pending = {
      email: "pending@example.com",
      username: "pendinguser",
      full_name: "Pending User",
      password_hash: testPasswordHash,
      verification_token_hash: oldHash,
      expires_at: new Date(Date.now() + 60_000),
    };
    mockDb.PendingRegistration.records = [pending];

    const res = await agent.post("/api/auth/resend-verification", {
      body: { email: pending.email }
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.resend_available_in, 120);
    assert.notEqual(pending.verification_token_hash, oldHash);
  });

  await t.test("POST /api/auth/verify-email activates an account from a link token", async () => {
    const token = crypto.randomBytes(32).toString("hex");
    mockDb.PendingRegistration.records = [{
      email: "verified@example.com",
      username: "verifieduser",
      full_name: "Verified User",
      password_hash: testPasswordHash,
      verification_token_hash: hashToken(token),
      expires_at: new Date(Date.now() + 60_000),
    }];

    const res = await agent.post("/api/auth/verify-email", {
      body: { token }
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.email, "verified@example.com");
    assert.equal(res.body.data.username, "verifieduser");
  });

  await t.test("POST /api/auth/reset-password accepts a link token", async () => {
    const token = crypto.randomBytes(32).toString("hex");
    mockDb.PasswordResetToken.records = [{
      token_hash: hashToken(token),
      user_id: testUser.user_id,
      used_at: null,
      expires_at: new Date(Date.now() + 60_000),
    }];

    const res = await agent.post("/api/auth/reset-password", {
      body: {
        token,
        new_password: "NewPassword123!",
        confirm_password: "NewPassword123!"
      }
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    testPassword = "NewPassword123!";
  });

  await t.test("POST /api/auth/refresh rotates a refresh token", async () => {
    const loginRes = await agent.post("/api/auth/login", {
      body: { identifier: "test@example.com", password: testPassword }
    });
    const refreshToken = getRefreshCookie(loginRes);
    assert.ok(refreshToken);
    const storedRefreshToken = mockDb.RefreshToken.records.find(
      (record) => record.token_hash === hashToken(refreshToken)
    );
    storedRefreshToken.revoked_at = null;
    storedRefreshToken.replaced_by_hash = null;
    storedRefreshToken.created_at = new Date();
    storedRefreshToken.user = testUser;

    const res = await agent.post("/api/auth/refresh", {
      headers: { Cookie: `refresh_token=${encodeURIComponent(refreshToken)}` },
      body: {}
    });

    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.refreshToken, undefined);
    assert.ok(getRefreshCookie(res));
  });

  await t.test("GET /api/auth/me", async () => {
    // We need to login first to get a token, but we can also just use the token generator directly
    const loginRes = await agent.post("/api/auth/login", {
      body: { identifier: "test@example.com", password: testPassword }
    });
    const token = loginRes.body.token;

    const res = await agent.get("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.email, "test@example.com");
  });

  await t.test("POST /api/auth/logout", async () => {
    const loginRes = await agent.post("/api/auth/login", {
      body: { identifier: "test@example.com", password: testPassword }
    });
    const token = loginRes.body.token;
    const refreshToken = getRefreshCookie(loginRes);

    const res = await agent.post("/api/auth/logout", {
      headers: {
        Authorization: `Bearer ${token}`,
        Cookie: `refresh_token=${encodeURIComponent(refreshToken)}`,
      },
      body: {}
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.match(res.headers.get("set-cookie") || "", /refresh_token=;/);
  });
});
