const test = require("node:test");
const assert = require("node:assert/strict");
const { createAgent, createUserToken } = require("./helpers/setup");

test("Email Endpoints", async (t) => {
  let agent;
  let token;

  t.before(async () => {
    agent = await createAgent();
    token = createUserToken();
  });

  t.after(async () => {
    await agent.close();
  });

  await t.test("POST /api/email/analyze", async () => {
    const res = await agent.post("/api/email/analyze", {
      headers: { Authorization: `Bearer ${token}` },
      body: { content: "Subject: test\r\n\r\nBody" }
    });
    assert.ok(res.status === 201 || res.status === 202);
    assert.equal(res.body.success, true);
  });

  await t.test("POST /api/email/headers", async () => {
    const res = await agent.post("/api/email/headers", {
      headers: { Authorization: `Bearer ${token}` },
      body: { headers: "Authentication-Results: mx.test.com; spf=pass" }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data);
  });
});
