const test = require("node:test");
const assert = require("node:assert/strict");
const { createAgent, createAdminToken, mockDb } = require("./helpers/setup");

test("Settings Endpoints", async (t) => {
  let agent;
  let token;

  t.before(async () => {
    agent = await createAgent();
    token = createAdminToken();
    mockDb.SystemSetting.records = [{ key: "maintenance_mode", value: "false" }];
  });

  t.after(async () => {
    await agent.close();
  });

  await t.test("GET /api/settings", async () => {
    const res = await agent.get("/api/settings");
    assert.equal(res.status, 200);
    assert.ok(res.body.data);
  });

  await t.test("PUT /api/settings/:key", async () => {
    const res = await agent.put("/api/settings/maintenance_mode", {
      headers: { Authorization: `Bearer ${token}` },
      body: { value: "true", description: "testing" }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
