const test = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { createAgent, mockDb } = require("./helpers/setup");
const crypto = require("crypto");

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
    assert.ok(res.body.refreshToken);
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

    const res = await agent.post("/api/auth/logout", {
      headers: { Authorization: `Bearer ${token}` },
      body: {}
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
