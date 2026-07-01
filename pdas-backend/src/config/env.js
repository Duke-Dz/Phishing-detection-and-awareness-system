require("dotenv").config({ quiet: true });

const integer = (name, fallback) => {
  const raw = process.env[name];
  const value = raw === undefined || raw === "" ? fallback : Number.parseInt(raw, 10);
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer`);
  }
  return value;
};

const boolean = (name, fallback = false) => {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  if (!["true", "false"].includes(raw.toLowerCase())) {
    throw new Error(`${name} must be either true or false`);
  }
  return raw.toLowerCase() === "true";
};

const buildConfig = () => ({
  port: integer("PORT", 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  logDir: process.env.LOG_DIR || "logs",
  db: {
    host: process.env.DB_HOST,
    port: integer("DB_PORT", 5432),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: boolean("DB_SSL"),
    sslRejectUnauthorized: boolean("DB_SSL_REJECT_UNAUTHORIZED", true),
    logging: boolean("SQL_LOGGING"),
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshTokenExpiresDays: integer("REFRESH_TOKEN_EXPIRES_DAYS", 30),
  },
  https: {
    enabled: boolean("HTTPS_ENABLED"),
    force: boolean("FORCE_HTTPS"),
    keyPath: process.env.HTTPS_KEY_PATH,
    certPath: process.env.HTTPS_CERT_PATH,
  },
  worker: {
    intervalMs: integer("SCAN_WORKER_INTERVAL_MS", 5000),
    batchSize: integer("SCAN_WORKER_BATCH_SIZE", 5),
    maxAttempts: integer("SCAN_JOB_MAX_ATTEMPTS", 3),
  },
  mail: {
    host: process.env.MAIL_HOST,
    port: integer("MAIL_PORT", 587),
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM || "CyberSense Security <noreply@cybersense.local>",
    support: process.env.SUPPORT_EMAIL || "support@cybersense.local",
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  passwordResetTokenExpiryMinutes: integer("PASSWORD_RESET_TOKEN_EXPIRY_MINUTES", 60),
  emailVerificationTokenExpiryHours: integer("EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS", 24),
  apis: {
    googleSafeBrowsingKey: process.env.GOOGLE_SAFE_BROWSING_API_KEY || "",
    virusTotalApiKey: process.env.VIRUSTOTAL_API_KEY || "",
  },
});

const validateConfig = (config, { requireDatabase = true } = {}) => {
  const missing = [];
  if (!config.jwt.secret) missing.push("JWT_SECRET");
  if (requireDatabase) {
    if (!config.db.host) missing.push("DB_HOST");
    if (!config.db.name) missing.push("DB_NAME");
    if (!config.db.user) missing.push("DB_USER");
    if (!config.db.password) missing.push("DB_PASSWORD");
  }
  if (config.https.enabled) {
    if (!config.https.keyPath) missing.push("HTTPS_KEY_PATH");
    if (!config.https.certPath) missing.push("HTTPS_CERT_PATH");
  }
  if ((config.mail.host || config.mail.user || config.mail.pass) &&
      !(config.mail.host && config.mail.user && config.mail.pass)) {
    throw new Error("Mail configuration is incomplete; MAIL_HOST, MAIL_USER, and MAIL_PASS are required together");
  }
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  return config;
};

const config = buildConfig();

module.exports = Object.assign(config, { buildConfig, validateConfig });
