const test = require("node:test");
const assert = require("node:assert/strict");
const { createAgent, createUserToken, mockDb } = require("./helpers/setup");

test("Notifications Endpoints", async (t) => {
  let agent;
  let token;

  t.before(async () => {
    agent = await createAgent();
    token = createUserToken();
    mockDb.Notification.records = [
      { notification_id: "notif-1", user_id: "user-1", is_read: false }
    ];
  });

  t.after(async () => {
    await agent.close();
  });

  await t.test("GET /api/notifications", async () => {
    const res = await agent.get("/api/notifications", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  await t.test("PATCH /api/notifications/read-all", async () => {
    const res = await agent.patch("/api/notifications/read-all", {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
