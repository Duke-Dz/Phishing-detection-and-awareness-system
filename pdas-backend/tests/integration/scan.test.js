const test = require("node:test");
const assert = require("node:assert/strict");
const { createAgent, createUserToken, mockDb } = require("./helpers/setup");

test("Scan Endpoints", async (t) => {
  let agent;
  let token;

  t.before(async () => {
    agent = await createAgent();
    token = createUserToken();
    mockDb.ScanResult.records = [
      { scan_id: "00000000-0000-4000-8000-000000000123", user_id: "user-1", target: "http://example.com", classification: "safe" }
    ];
    mockDb.ScanJob.records = [
      { job_id: "00000000-0000-4000-8000-000000000124", user_id: "user-1", status: "completed" }
    ];
  });

  t.after(async () => {
    await agent.close();
  });

  await t.test("POST /api/scan/url", async () => {
    const res = await agent.post("/api/scan/url", {
      headers: { Authorization: `Bearer ${token}` },
      body: { url: "http://example.com" }
    });
    assert.ok(res.status === 201 || res.status === 202);
    assert.equal(res.body.success, true);
  });

  await t.test("POST /api/scan/sms", async () => {
    const res = await agent.post("/api/scan/sms", {
      headers: { Authorization: `Bearer ${token}` },
      body: { content: "Win a free prize", sender: "Unknown" }
    });
    assert.ok(res.status === 201 || res.status === 202);
    assert.equal(res.body.success, true);
  });

  await t.test("GET /api/scan/history", async () => {
    const res = await agent.get("/api/scan/history", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  await t.test("GET /api/scan/:scanId", async () => {
    const res = await agent.get("/api/scan/00000000-0000-4000-8000-000000000123", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.scan_id, "00000000-0000-4000-8000-000000000123");
  });

  await t.test("GET /api/scan/jobs/:jobId", async () => {
    const res = await agent.get("/api/scan/jobs/00000000-0000-4000-8000-000000000124", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.job_id, "00000000-0000-4000-8000-000000000124");
  });
});
