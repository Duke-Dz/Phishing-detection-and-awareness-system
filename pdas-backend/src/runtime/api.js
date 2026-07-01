const fs = require("fs");
const https = require("https");
const app = require("../app");
const config = require("../config/env");
const { sequelize, testConnection } = require("../config/sequelize");
const logger = require("../utils/logger");
const { installProcessHandlers } = require("./lifecycle");
const { closeMailService } = require("../services/mailService");

require("../models");

const startApi = async () => {
  config.validateConfig(config);
  await testConnection();

  const server = config.https.enabled
    ? https.createServer({
        key: fs.readFileSync(config.https.keyPath),
        cert: fs.readFileSync(config.https.certPath),
      }, app)
    : app;

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, resolve);
  });

  logger.info("api.started", {
    port: config.port,
    protocol: config.https.enabled ? "https" : "http",
    environment: config.nodeEnv,
  });

  installProcessHandlers(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await closeMailService();
    await sequelize.close();
  });

  return server;
};

module.exports = { startApi };
