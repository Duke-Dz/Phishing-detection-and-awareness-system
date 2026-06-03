const metrics = {
  startedAt: new Date(),
  requests: 0,
  responses: {},
  totalDurationMs: 0,
};

const metricsMiddleware = (req, res, next) => {
  const started = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1000000;
    metrics.requests += 1;
    metrics.totalDurationMs += durationMs;
    metrics.responses[res.statusCode] = (metrics.responses[res.statusCode] || 0) + 1;
  });

  next();
};

const getMetricsSnapshot = () => ({
  uptime_seconds: Math.round(process.uptime()),
  started_at: metrics.startedAt.toISOString(),
  requests_total: metrics.requests,
  responses_by_status: metrics.responses,
  average_duration_ms:
    metrics.requests > 0 ? Number((metrics.totalDurationMs / metrics.requests).toFixed(2)) : 0,
  memory: process.memoryUsage(),
});

module.exports = { getMetricsSnapshot, metricsMiddleware };
