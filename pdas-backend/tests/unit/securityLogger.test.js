const test = require("node:test");
const assert = require("node:assert/strict");

// Mock the model before requiring the module under test
const createCalls = [];
const mockSecurityEvent = {
  create: async (data) => {
    createCalls.push(data);
    return { ...data, id: "mock-id" };
  }
};

const proxyquire = require("node:module").createRequire(__filename);
const originalRequire = require("node:module").prototype.require;
require("node:module").prototype.require = function(path) {
  if (path === "../models") {
    return { SecurityEvent: mockSecurityEvent };
  }
  return originalRequire.apply(this, arguments);
};

const { logSecurityEvent } = require("../../src/utils/securityLogger");

// Restore require
require("node:module").prototype.require = originalRequire;

test("logSecurityEvent creates a security event without awaiting", async () => {
  createCalls.length = 0; // reset
  
  // Call the function
  logSecurityEvent({
    user_id: "user-123",
    event_type: "LOGIN_SUCCESS",
    ip_address: "127.0.0.1",
    user_agent: "TestAgent",
    metadata: { key: "value" }
  });

  // Since it's fire-and-forget, we need to let the event loop process the promise
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0].user_id, "user-123");
  assert.equal(createCalls[0].event_type, "LOGIN_SUCCESS");
  assert.equal(createCalls[0].ip_address, "127.0.0.1");
  assert.equal(createCalls[0].user_agent, "TestAgent");
  assert.deepEqual(createCalls[0].metadata, { key: "value" });
});

test("logSecurityEvent handles missing optional fields gracefully", async () => {
  createCalls.length = 0; // reset
  
  logSecurityEvent({
    user_id: "user-123",
    event_type: "LOGIN_FAILED",
  });

  await new Promise(resolve => setTimeout(resolve, 0));

  assert.equal(createCalls.length, 1);
  assert.equal(createCalls[0].user_id, "user-123");
  assert.equal(createCalls[0].event_type, "LOGIN_FAILED");
  assert.equal(createCalls[0].ip_address, null);
  assert.equal(createCalls[0].user_agent, null);
  assert.deepEqual(createCalls[0].metadata, {});
});
