const test = require("node:test");
const assert = require("node:assert/strict");
const { createAgent, createAdminToken, mockDb } = require("./helpers/setup");

test("Audit Endpoints", async (t) => {
  let agent;
  let token;

  t.before(async () => {
    agent = await createAgent();
    token = createAdminToken();
    mockDb.AuditLog.records = [{ log_id: "l1", action: "test" }];
  });

  t.after(async () => {
    await agent.close();
  });

  await t.test("GET /api/audit", async () => {
    const res = await agent.get("/api/audit", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });
});
