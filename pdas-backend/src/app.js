const express = require("express");
const crypto = require("crypto");
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
app.use(helmet({
  referrerPolicy: { policy: "no-referrer" },
}));
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
const decodeCookiePart = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
app.use((req, _res, next) => {
  req.cookies = Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [
          decodeCookiePart(part.slice(0, index)),
          decodeCookiePart(part.slice(index + 1)),
        ];
      }),
  );
  next();
});
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
  credentials: true,
}));
app.use(maintenanceMiddleware);

const limiter = (windowMs, limit, message, overrides = {}) => rateLimit({
  windowMs,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: "RATE_LIMITED", message },
  handler: (req, res, _next, options) => {
    const resetTime = req.rateLimit?.resetTime;
    const retryAfterSeconds = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : Math.ceil(windowMs / 1000);
    res.status(options.statusCode).json({
      ...options.message,
      retry_after_seconds: retryAfterSeconds,
    });
  },
  ...overrides,
});

const passwordResetEmailKey = (req) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  return `password-reset:${crypto.createHash("sha256").update(email).digest("hex")}`;
};

const verificationEmailKey = (req) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  return `verification-email:${crypto.createHash("sha256").update(email).digest("hex")}`;
};

const registrationIdentityKey = (req) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const username = String(req.body?.username || "").trim().toLowerCase();
  const identity = `${email}:${username}`;
  return `registration:${crypto.createHash("sha256").update(identity).digest("hex")}`;
};

app.use(limiter(15 * 60 * 1000, 100, "Too many requests, please slow down."));
app.use("/api/auth/login", limiter(15 * 60 * 1000, 10, "Too many login attempts, try again later."));
app.use("/api/auth/register", limiter(
  15 * 60 * 1000,
  30,
  "Too many signup attempts from this network. Please wait a few minutes and try again.",
  { skipSuccessfulRequests: true },
));
app.use("/api/auth/register", limiter(
  60 * 60 * 1000,
  8,
  "Too many signup attempts for these account details. Please wait before trying again.",
  { keyGenerator: registrationIdentityKey },
));
app.use("/api/auth/register", limiter(
  24 * 60 * 60 * 1000,
  100,
  "This network has created many account requests today. Please try again later.",
  { skipFailedRequests: true },
));
app.use("/api/auth/resend-verification", limiter(
  60 * 60 * 1000,
  3,
  "Too many verification email requests. Please wait before requesting another link.",
  { keyGenerator: verificationEmailKey },
));
app.use("/api/auth/forgot-password", limiter(
  60 * 60 * 1000,
  10,
  "Too many password reset requests from this network, try again later.",
));
app.use("/api/auth/forgot-password", limiter(
  60 * 60 * 1000,
  3,
  "Too many password reset requests for this account, try again later.",
  { keyGenerator: passwordResetEmailKey },
));
app.use("/api/auth/forgot-password", limiter(
  60 * 1000,
  1,
  "Please wait before requesting another password reset link.",
  { keyGenerator: passwordResetEmailKey },
));
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
    const checks = await Promise.all([
      sequelize.query("SELECT 1"),
      sequelize.query("SELECT 1 FROM users LIMIT 1"),
      sequelize.query("SELECT 1 FROM scan_results LIMIT 1"),
      sequelize.query("SELECT 1 FROM pending_registrations LIMIT 1"),
    ]);
    res.json({
      success: true,
      message: "API and database are ready",
      checks: {
        database: "ok",
        required_tables: checks.length - 1,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "API is not ready",
      reason: error.name || "READINESS_CHECK_FAILED",
    });
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
