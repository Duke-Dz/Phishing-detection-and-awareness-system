const test = require("node:test");
const assert = require("node:assert/strict");
const { createAgent, createUserToken, mockDb } = require("./helpers/setup");

test("Export Endpoints", async (t) => {
  let agent;
  let token;

  t.before(async () => {
    agent = await createAgent();
    token = createUserToken();
    mockDb.ScanResult.records = [{ scan_id: "s1", target: "http://example.com" }];
  });

  t.after(async () => {
    await agent.close();
  });

  await t.test("GET /api/export/scans (JSON)", async () => {
    const res = await agent.get("/api/export/scans?format=json", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  });

  await t.test("GET /api/export/scans (CSV)", async () => {
    const res = await agent.get("/api/export/scans?format=csv", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    assert.ok(res.headers.get("content-type").includes("text/csv"));
  });
});
