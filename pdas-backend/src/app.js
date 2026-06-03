const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const awarenessRoutes = require("./routes/awarenessRoutes");
const emailRoutes = require("./routes/emailRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reportRoutes = require("./routes/reportRoutes");
const scanRoutes = require("./routes/scanRoutes");
const logger = require("./utils/logger");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { protect } = require("./middleware/authMiddleware");
const { authorize } = require("./middleware/roleMiddleware");
const { getMetricsSnapshot, metricsMiddleware } = require("./middleware/metricsMiddleware");
const { sequelize } = require("./config/sequelize");

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(metricsMiddleware);
app.use((req, res, next) => {
  if (process.env.FORCE_HTTPS === "true" && !req.secure) {
    return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
  }
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

if (process.env.NODE_ENV === "development") {
  app.use(
    morgan("dev", {
      stream: { write: (message) => logger.http(message.trim()) },
    }),
  );
}

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Phishing Detection and Awareness System API",
    docs: "/api/health",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
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

app.use("/api/auth", authRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/awareness", awarenessRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
