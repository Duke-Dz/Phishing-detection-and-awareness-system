const test = require("node:test");
const assert = require("node:assert/strict");
const { createAgent, createUserToken, mockDb } = require("./helpers/setup");

test("Reports Endpoints", async (t) => {
  let agent;
  let token;

  t.before(async () => {
    agent = await createAgent();
    token = createUserToken();
    mockDb.Report.records = [
      { report_id: "report-123", user_id: "user-1", status: "pending" }
    ];
  });

  t.after(async () => {
    await agent.close();
  });

  await t.test("GET /api/reports", async () => {
    const res = await agent.get("/api/reports", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  await t.test("POST /api/reports", async () => {
    const res = await agent.post("/api/reports", {
      headers: { Authorization: `Bearer ${token}` },
      body: { report_type: "url", content: "http://evil.com" }
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
  });

  await t.test("GET /api/reports/:id", async () => {
    const res = await agent.get("/api/reports/report-123", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
