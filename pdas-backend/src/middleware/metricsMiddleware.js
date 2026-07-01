const metrics = {
  startedAt: new Date(),
  requests: 0,
  responses: {},
  totalDurationMs: 0,
  slowRequests: 0,
  routeTimings: {},
};

const metricsMiddleware = (req, res, next) => {
  const started = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1000000;
    metrics.requests += 1;
    metrics.totalDurationMs += durationMs;
    metrics.responses[res.statusCode] = (metrics.responses[res.statusCode] || 0) + 1;

    // Per-route timing
    const routeKey = `${req.method} ${req.route ? req.route.path : req.path}`;
    if (!metrics.routeTimings[routeKey]) {
      metrics.routeTimings[routeKey] = { count: 0, totalMs: 0, maxMs: 0 };
    }
    metrics.routeTimings[routeKey].count += 1;
    metrics.routeTimings[routeKey].totalMs += durationMs;
    if (durationMs > metrics.routeTimings[routeKey].maxMs) {
      metrics.routeTimings[routeKey].maxMs = durationMs;
    }

    if (durationMs > 1000) {
      metrics.slowRequests += 1;
    }
  });

  next();
};

const getMetricsSnapshot = () => {
  // Build per-route averages
  const routeStats = {};
  for (const [route, data] of Object.entries(metrics.routeTimings)) {
    routeStats[route] = {
      count: data.count,
      avg_ms: data.count > 0 ? Number((data.totalMs / data.count).toFixed(2)) : 0,
      max_ms: Number(data.maxMs.toFixed(2)),
    };
  }

  return {
    uptime_seconds: Math.round(process.uptime()),
    started_at: metrics.startedAt.toISOString(),
    requests_total: metrics.requests,
    responses_by_status: metrics.responses,
    average_duration_ms:
      metrics.requests > 0 ? Number((metrics.totalDurationMs / metrics.requests).toFixed(2)) : 0,
    slow_requests: metrics.slowRequests,
    route_timings: routeStats,
    memory: process.memoryUsage(),
  };
};

module.exports = { getMetricsSnapshot, metricsMiddleware };
