const express = require("express");
const compression = require("compression");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const config = require("./config/env");
const adminRoutes = require("./routes/adminRoutes");
const auditRoutes = require("./routes/auditRoutes");
const authRoutes = require("./routes/authRoutes");
const awarenessRoutes = require("./routes/awarenessRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const emailRoutes = require("./routes/emailRoutes");
const exportRoutes = require("./routes/exportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reportRoutes = require("./routes/reportRoutes");
const scanRoutes = require("./routes/scanRoutes");
const sseRoutes = require("./routes/sseRoutes");
const userRoutes = require("./routes/userRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { protect } = require("./middleware/authMiddleware");
const { authorize } = require("./middleware/roleMiddleware");
const { getMetricsSnapshot, metricsMiddleware } = require("./middleware/metricsMiddleware");
const { requestContext } = require("./middleware/requestContext");
const { sequelize } = require("./config/sequelize");
const { getApiStatus } = require("./services/externalThreatService");
const { getActiveConnections } = require("./services/sseService");
const cacheService = require("./services/cacheService");
const { setupSwagger } = require("./config/swagger");
const maintenanceMiddleware = require("./middleware/maintenanceMiddleware");
const { getMailStatus } = require("./services/mailService");

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(requestContext);
app.use(helmet());
app.use(compression());
app.use(metricsMiddleware);
app.use((req, res, next) => {
  if (config.https.force && !req.secure) {
    return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.text({ type: "text/plain", limit: "5mb" }));
app.use(cors({
  origin: (origin, callback) => {
    const allowed = String(config.frontendUrl).split(",").map((value) => value.trim()).filter(Boolean);
    if (config.nodeEnv === "production" && origin && !allowed.includes(origin)) {
      return callback(new Error("Origin is not allowed by CORS"));
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  exposedHeaders: ["X-Request-Id"],
}));
app.use(maintenanceMiddleware);

const limiter = (windowMs, limit, message) => rateLimit({
  windowMs,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message },
});

app.use(limiter(15 * 60 * 1000, 100, "Too many requests, please slow down."));
app.use("/api/auth/login", limiter(15 * 60 * 1000, 10, "Too many login attempts, try again later."));
app.use("/api/auth/register", limiter(60 * 60 * 1000, 5, "Too many accounts created from this IP."));
app.use("/api/auth/forgot-password", limiter(60 * 60 * 1000, 3, "Too many password reset requests, try again later."));
app.use("/api/scan", limiter(60 * 1000, 20, "Too many scan requests, slow down."));
app.use("/api/reports", limiter(60 * 1000, 20, "Too many report requests, slow down."));

setupSwagger(app);

app.get("/", (_req, res) => res.json({
  success: true,
  message: "Phishing Detection and Awareness System API",
  api: "/api",
  docs: "/api/docs",
}));

const health = (_req, res) => res.json({
  success: true,
  message: "API is healthy",
  timestamp: new Date().toISOString(),
  environment: config.nodeEnv,
  uptime_seconds: Math.round(process.uptime()),
});

const ready = async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ success: true, message: "API and database are ready", timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ success: false, message: "API is not ready" });
  }
};

const diagnostics = (_req, res) => res.json({
  success: true,
  data: {
    metrics: getMetricsSnapshot(),
    integrations: getApiStatus(),
    mail: getMailStatus(),
    sse_connections: getActiveConnections(),
    cache: cacheService.getStats(),
  },
});

app.get("/api/health", health);
app.get("/api/ready", ready);
app.get("/api/diagnostics", protect, authorize("admin"), diagnostics);
app.get("/api/metrics", protect, authorize("admin"), diagnostics);

const routes = {
  auth: authRoutes,
  scan: scanRoutes,
  email: emailRoutes,
  reports: reportRoutes,
  awareness: awarenessRoutes,
  admin: adminRoutes,
  notifications: notificationRoutes,
  dashboard: dashboardRoutes,
  audit: auditRoutes,
  export: exportRoutes,
  sse: sseRoutes,
  users: userRoutes,
  settings: settingsRoutes,
};

for (const [path, router] of Object.entries(routes)) {
  app.use(`/api/${path}`, router);
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
