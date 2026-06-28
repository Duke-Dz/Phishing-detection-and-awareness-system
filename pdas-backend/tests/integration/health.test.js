const test = require("node:test");
const assert = require("node:assert/strict");
const { createAgent } = require("./helpers/setup");

test("Health Endpoints", async (t) => {
  let agent;

  t.before(async () => {
    agent = await createAgent();
  });

  t.after(async () => {
    await agent.close();
  });

  await t.test("GET / should return API info", async () => {
    const res = await agent.get("/");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.match(res.body.message, /Phishing Detection/);
  });

  await t.test("GET /api/health should return health metrics", async () => {
    const res = await agent.get("/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.message, "API is healthy");
    assert.ok(res.body.timestamp);
  });

  await t.test("GET /api/ready should return true", async () => {
    const res = await agent.get("/api/ready");
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
