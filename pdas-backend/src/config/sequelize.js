const { Sequelize } = require("sequelize");
const logger = require("../utils/logger");

const sslOptions =
  process.env.DB_SSL === "true"
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
        },
      }
    : undefined;

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    dialect: "postgres",
    logging:
      process.env.SQL_LOGGING === "true" ? (message) => logger.debug(message) : false,
    dialectOptions: sslOptions,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

const testConnection = async () => {
  await sequelize.authenticate();
  logger.info(`Database connected: ${process.env.DB_NAME} on port ${process.env.DB_PORT}`);
};

module.exports = { sequelize, testConnection };
