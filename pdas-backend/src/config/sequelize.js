const { Sequelize } = require("sequelize");
const config = require("./env");
const logger = require("../utils/logger");

const sequelize = new Sequelize(config.db.name || "", config.db.user || "", config.db.password || "", {
  host: config.db.host,
  port: config.db.port,
  dialect: "postgres",
  logging: config.db.logging ? (message) => logger.debug("database.query", { sql: message }) : false,
  dialectOptions: config.db.ssl
    ? { ssl: { require: true, rejectUnauthorized: config.db.sslRejectUnauthorized } }
    : undefined,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
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
