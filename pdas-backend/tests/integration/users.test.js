const test = require("node:test");
const assert = require("node:assert/strict");
const { createAgent, createUserToken, mockDb } = require("./helpers/setup");

test("Users Endpoints", async (t) => {
  let agent;
  let token;

  t.before(async () => {
    agent = await createAgent();
    token = createUserToken();
    mockDb.User.records = [{ user_id: "user-1", email: "test@example.com", role: "user", is_active: true }];
  });

  t.after(async () => {
    await agent.close();
  });

  await t.test("PUT /api/users/profile", async () => {
    const res = await agent.put("/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
      body: { full_name: "Updated Name" }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  await t.test("POST /api/users/unsubscribe", async () => {
    const res = await agent.post("/api/users/unsubscribe", {
      body: { email: "test@example.com", token: "invalid_token_for_mock" }
    });
    assert.equal(res.status, 403);
  });
});
