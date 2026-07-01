const crypto = require("crypto");
const logger = require("../utils/logger");

const requestContext = (req, res, next) => {
  const suppliedId = req.get("x-request-id");
  req.id = suppliedId && /^[a-zA-Z0-9._-]{8,128}$/.test(suppliedId)
    ? suppliedId
    : crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);

  const started = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    const route = req.originalUrl.split("?")[0];
    const requestError = res.locals.requestError;
    const metadata = {
      request_id: req.id,
      method: req.method,
      route,
      status: res.statusCode,
      duration_ms: Number(durationMs.toFixed(2)),
      slow: durationMs > 1000 || undefined,
      response_bytes: Number(res.getHeader("content-length")) || undefined,
      ip: req.ip,
      user_agent: req.get("user-agent") || undefined,
      user_id: req.user?.user_id,
      role: req.user?.role,
      ...(requestError && {
        error: {
          name: requestError.name,
          message: requestError.message,
          code: requestError.code,
          ...(res.statusCode >= 500 && { stack: requestError.stack }),
        },
      }),
    };
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "http";
    logger.log(level, "http.request", metadata);
  });
  next();
};

module.exports = { requestContext };
