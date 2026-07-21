const { Sequelize } = require("sequelize");
const config = require("./env");
const logger = require("../utils/logger");

const sequelize = new Sequelize(config.db.name || "", config.db.user || "", config.db.password || "", {
  host: config.db.host,
  port: config.db.port,
  dialect: "postgres",
  benchmark: true,
  logging: (message, timingMs) => {
    if (!config.db.logging && timingMs < config.performance.slowQueryThresholdMs) {
      return;
    }

    const level = timingMs >= config.performance.slowQueryThresholdMs
      ? "warn"
      : "debug";
    logger[level]("database.query", {
      duration_ms: Number(timingMs || 0),
      slow: timingMs >= config.performance.slowQueryThresholdMs,
      sql: config.db.logging ? message : undefined,
    });
  },
  dialectOptions: config.db.ssl
    ? { ssl: { require: true, rejectUnauthorized: config.db.sslRejectUnauthorized } }
    : undefined,
  pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
});

const testConnection = async () => {
  await sequelize.authenticate();
  logger.info("database.connected", {
    database: config.db.name,
    host: config.db.host,
    port: config.db.port,
  });
};

module.exports = { sequelize, testConnection };
