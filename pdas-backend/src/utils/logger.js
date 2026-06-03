// src/utils/logger.js

// winston is the most popular Node.js logging library
// It supports log levels: error > warn > info > http > debug
const winston = require("winston");

// process.env.NODE_ENV tells us if we're in development or production
const { NODE_ENV } = process.env;

// Define the log format for DEVELOPMENT (colourful, easy to read)
const devFormat = winston.format.combine(
  // colorize adds colour to log levels in terminal output
  winston.format.colorize(),
  // timestamp adds the current time to each log entry
  winston.format.timestamp({ format: "HH:mm:ss" }),
  // printf lets us define the exact string format of each log line
  winston.format.printf(
    ({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`,
  ),
);

// Define the log format for PRODUCTION (structured JSON — easier for log tools to parse)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(), // outputs: {"timestamp":"...","level":"info","message":"..."}
);

// createLogger builds the actual logger instance
const logger = winston.createLogger({
  // Only log entries at this level and ABOVE will be recorded
  // In dev we want everything (debug); in prod only important stuff (info)
  level: NODE_ENV === "production" ? "info" : "debug",

  // transports define WHERE logs are sent
  transports: [
    // Console transport — prints to terminal
    new winston.transports.Console({
      format: NODE_ENV === "development" ? devFormat : prodFormat,
    }),

    // File transport — saves all errors to a file permanently
    // This is crucial in production so you can review past errors
    new winston.transports.File({
      filename: "logs/error.log", // errors only
      level: "error",
      format: prodFormat,
    }),

    // File transport — saves everything (info, warn, error) to combined log
    new winston.transports.File({
      filename: "logs/combined.log",
      format: prodFormat,
    }),
  ],
});

module.exports = logger;
