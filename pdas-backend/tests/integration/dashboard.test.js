const test = require("node:test");
const assert = require("node:assert/strict");
const { createAgent, createUserToken } = require("./helpers/setup");

test("Dashboard Endpoints", async (t) => {
  let agent;
  let token;

  t.before(async () => {
    agent = await createAgent();
    token = createUserToken();
  });

  t.after(async () => {
    await agent.close();
  });

  await t.test("GET /api/dashboard/stats", async () => {
    const res = await agent.get("/api/dashboard/stats", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data);
  });
});
