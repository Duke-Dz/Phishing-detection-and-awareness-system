const express = require("express");
const compression = require("compression");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

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
const logger = require("./utils/logger");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { protect } = require("./middleware/authMiddleware");
const { authorize } = require("./middleware/roleMiddleware");
const { getMetricsSnapshot, metricsMiddleware } = require("./middleware/metricsMiddleware");
const { sequelize } = require("./config/sequelize");
const { getApiStatus } = require("./services/externalThreatService");
const { getActiveConnections } = require("./services/sseService");
const cacheService = require("./services/cacheService");
const { setupSwagger } = require("./config/swagger");

const app = express();

app.set("trust proxy", 1);

// ── Security & Compression ─────────────────────────────────────────────
app.use(helmet());
app.use(compression());  // Compress all responses (60-80% size reduction for JSON)
app.use(metricsMiddleware);
app.use((req, res, next) => {
  if (process.env.FORCE_HTTPS === "true" && !req.secure) {
    return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// Support raw text bodies for email webhook
app.use(express.text({ type: "text/plain", limit: "5mb" }));

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = String(process.env.FRONTEND_URL || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      if (process.env.NODE_ENV === "production") {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Origin is not allowed by CORS"));
      }

      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Layered Rate Limiting ──────────────────────────────────────────────
// Global limiter — applies to everything (tightened from 300)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please slow down." },
  }),
);

// Auth-specific: strict limits on login (prevents brute-force password guessing)
app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many login attempts, try again later." },
  }),
);

// Auth-specific: strict limits on registration (prevents mass account creation)
app.use(
  "/api/auth/register",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many accounts created from this IP." },
  }),
);

// Auth-specific: strict limits on forgot-password (prevents abuse)
app.use(
  "/api/auth/forgot-password",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many password reset requests, try again later." },
  }),
);

// Heavy routes: scans call external APIs so must be limited
app.use(
  "/api/scan",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many scan requests, slow down." },
  }),
);

// Heavy routes: reports trigger scans internally
app.use(
  "/api/reports",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many report requests, slow down." },
  }),
);

if (process.env.NODE_ENV === "development") {
  app.use(
    morgan("dev", {
      stream: { write: (message) => logger.http(message.trim()) },
    }),
  );
}

// ── Swagger API Documentation ──────────────────────────────────────────
setupSwagger(app);

// ── Root & Health Endpoints ────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Phishing Detection and Awareness System API",
    docs: "/api/docs",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime_seconds: Math.round(process.uptime()),
    memory: {
      rss_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heap_used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
    external_apis: getApiStatus(),
    sse_connections: getActiveConnections(),
    cache: cacheService.getStats(),
  });
});

app.get("/api/ready", async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      success: true,
      message: "API and database are ready",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "API is not ready",
    });
  }
});

app.get("/api/metrics", protect, authorize("admin"), (_req, res) => {
  res.json({
    success: true,
    data: getMetricsSnapshot(),
  });
});

// ── API Routes ─────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/awareness", awarenessRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/sse", sseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);

// ── Error Handling ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
