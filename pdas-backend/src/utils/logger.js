const fs = require("fs");
const path = require("path");
const winston = require("winston");

const { NODE_ENV } = process.env;
const logDir = path.resolve("logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(
    ({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`,
  ),
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);

const logger = winston.createLogger({
  level: NODE_ENV === "production" ? "info" : "debug",
  transports: [
    new winston.transports.Console({
      format: NODE_ENV === "development" ? devFormat : prodFormat,
    }),
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      format: prodFormat,
    }),
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      format: prodFormat,
    }),
  ],
});

module.exports = logger;
