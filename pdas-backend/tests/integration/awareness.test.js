const test = require("node:test");
const assert = require("node:assert/strict");
const { createAgent, createUserToken, createAdminToken, mockDb } = require("./helpers/setup");

test("Awareness Endpoints", async (t) => {
  let agent;
  let userToken;
  let adminToken;

  t.before(async () => {
    agent = await createAgent();
    userToken = createUserToken();
    adminToken = createAdminToken();
    mockDb.AwarenessContent.records = [
      { content_id: "content-123", title: "Phishing 101" }
    ];
  });

  t.after(async () => {
    await agent.close();
  });

  await t.test("GET /api/awareness", async () => {
    const res = await agent.get("/api/awareness", {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  await t.test("POST /api/awareness (Admin)", async () => {
    const res = await agent.post("/api/awareness", {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { title: "New Course", category: "email", description: "Learn", body: "Content", difficulty: "beginner", duration_minutes: 10 }
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
  });

  await t.test("POST /api/awareness (User should fail)", async () => {
    const res = await agent.post("/api/awareness", {
      headers: { Authorization: `Bearer ${userToken}` },
      body: { title: "New", category: "email", description: "X", body: "X", difficulty: "beginner", duration_minutes: 5 }
    });
    assert.equal(res.status, 403);
  });
});
