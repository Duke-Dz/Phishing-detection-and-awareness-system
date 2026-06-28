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
      { scan_id: "scan-123", target: "http://example.com", classification: "safe" }
    ];
    mockDb.ScanJob.records = [
      { job_id: "job-123", status: "completed" }
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
    // Can be 200 or 202 depending on background scan
    assert.ok(res.status === 200 || res.status === 202);
    assert.equal(res.body.success, true);
  });

  await t.test("POST /api/scan/sms", async () => {
    const res = await agent.post("/api/scan/sms", {
      headers: { Authorization: `Bearer ${token}` },
      body: { content: "Win a free prize", sender: "Unknown" }
    });
    assert.ok(res.status === 200 || res.status === 202);
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
    const res = await agent.get("/api/scan/scan-123", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.scan_id, "scan-123");
  });

  await t.test("GET /api/scan/jobs/:jobId", async () => {
    const res = await agent.get("/api/scan/jobs/job-123", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.job_id, "job-123");
  });
});
