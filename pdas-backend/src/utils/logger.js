const fs = require("fs");
const path = require("path");
const winston = require("winston");

const SENSITIVE_KEYS = /^(authorization|cookie|set-cookie|password|pass|token|access_token|refresh_token|api_?key|otp|secret)$/i;
const REDACTED = "[REDACTED]";

const redact = (value, seen = new WeakSet()) => {
  if (Array.isArray(value)) return value.map((item) => redact(item, seen));
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  const clean = {};
  for (const [key, item] of Object.entries(value)) {
    clean[key] = SENSITIVE_KEYS.test(key) ? REDACTED : redact(item, seen);
  }
  return clean;
};

const redactFormat = winston.format((info) => {
  const clean = redact(info);
  Object.keys(info).forEach((key) => delete info[key]);
  Object.assign(info, clean);
  return info;
});

const nodeEnv = process.env.NODE_ENV || "development";
const logDir = path.resolve(process.env.LOG_DIR || "logs");
const consoleLevel = process.env.CONSOLE_LOG_LEVEL
  || (nodeEnv === "test" ? "warn" : nodeEnv === "development" ? "http" : "info");
fs.mkdirSync(logDir, { recursive: true });

const jsonFormat = winston.format.combine(
  redactFormat(),
  winston.format.errors({ stack: true }),
  winston.format.timestamp(),
  winston.format.json(),
);

const devFormat = winston.format.combine(
  redactFormat(),
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    delete metadata.service;
    delete metadata.environment;

    if (message === "http.request") {
      const error = metadata.error?.message ? ` error=${JSON.stringify(metadata.error.message)}` : "";
      const slow = metadata.slow ? " slow" : "";
      return `[${timestamp}] ${level}: ${metadata.method} ${metadata.route} ${metadata.status} ${metadata.duration_ms}ms${slow} id=${metadata.request_id}${error}`;
    }
    if (message === "database.connected") {
      return `[${timestamp}] ${level}: database connected db=${metadata.database} host=${metadata.host}:${metadata.port}`;
    }
    if (message === "api.started") {
      return `[${timestamp}] ${level}: API listening on ${metadata.protocol}://localhost:${metadata.port}`;
    }
    if (message.startsWith("mail.")) {
      const domain = metadata.recipient_domain ? ` domain=${metadata.recipient_domain}` : "";
      const reason = metadata.reason ? ` reason=${metadata.reason}` : "";
      const error = metadata.error?.message ? ` error=${JSON.stringify(metadata.error.message)}` : "";
      return `[${timestamp}] ${level}: ${message}${domain}${reason}${error}`;
    }
    const details = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : "";
    return `[${timestamp}] ${level}: ${message}${details}`;
  }),
);

const fileOptions = {
  maxsize: Number.parseInt(process.env.LOG_MAX_SIZE_BYTES || "10485760", 10),
  maxFiles: Number.parseInt(process.env.LOG_MAX_FILES || "10", 10),
  tailable: true,
  format: jsonFormat,
};

const transports = [
  new winston.transports.Console({
    level: consoleLevel,
    format: nodeEnv === "development" ? devFormat : jsonFormat,
  }),
];

if (nodeEnv !== "test") {
  transports.push(
    new winston.transports.File({ ...fileOptions, filename: path.join(logDir, "error.log"), level: "error" }),
    new winston.transports.File({ ...fileOptions, filename: path.join(logDir, "combined.log") }),
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (nodeEnv === "production" ? "info" : "debug"),
  defaultMeta: { service: "cybersense-backend", environment: nodeEnv },
  transports,
});

logger.on("error", (error) => {
  process.stderr.write(`Logger transport failed: ${error.message}\n`);
});

logger.redact = redact;

module.exports = logger;
