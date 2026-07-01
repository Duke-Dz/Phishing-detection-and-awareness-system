const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { requestContext } = require("../../src/middleware/requestContext");
const logger = require("../../src/utils/logger");

test("request context creates a correlation ID and redacts secrets", () => {
  const req = {
    headers: { authorization: "Bearer secret", password: "secret" },
    get: () => undefined,
    method: "POST",
    originalUrl: "/api/auth/login",
    ip: "127.0.0.1",
  };
  const res = new EventEmitter();
  res.statusCode = 200;
  res.setHeader = (key, value) => { res[key] = value; };
  res.getHeader = () => undefined;
  requestContext(req, res, () => {});
  assert.ok(req.id);
  assert.equal(res["X-Request-Id"], req.id);
  assert.deepEqual(logger.redact(req.headers), { authorization: "[REDACTED]", password: "[REDACTED]" });
});
