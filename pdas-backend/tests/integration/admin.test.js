const test = require("node:test");
const assert = require("node:assert/strict");
const { createAgent, createAdminToken, createUserToken, mockDb } = require("./helpers/setup");

test("Admin Endpoints", async (t) => {
  let agent;
  let adminToken;
  let userToken;

  t.before(async () => {
    agent = await createAgent();
    adminToken = createAdminToken();
    userToken = createUserToken();
    mockDb.User.records = [{ user_id: "u1", username: "test" }];
    mockDb.ThreatIntelligence.records = [{ threat_id: "t1", domain: "evil.com" }];
  });

  t.after(async () => {
    await agent.close();
  });

  await t.test("GET /api/admin/stats", async () => {
    const res = await agent.get("/api/admin/stats", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  await t.test("GET /api/admin/stats (User should fail)", async () => {
    const res = await agent.get("/api/admin/stats", {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.equal(res.status, 403);
  });

  await t.test("GET /api/admin/users", async () => {
    const res = await agent.get("/api/admin/users", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  await t.test("GET /api/admin/threat-intel", async () => {
    const res = await agent.get("/api/admin/threat-intel", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  await t.test("GET /api/admin/api-status", async () => {
    const res = await agent.get("/api/admin/api-status", {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
