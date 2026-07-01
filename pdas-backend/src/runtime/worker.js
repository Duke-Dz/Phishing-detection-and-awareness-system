const config = require("../config/env");
const { sequelize, testConnection } = require("../config/sequelize");
const { startScanJobWorker, stopScanJobWorker } = require("../services/scanJobService");
const logger = require("../utils/logger");
const { installProcessHandlers } = require("./lifecycle");

require("../models");

const startWorker = async () => {
  config.validateConfig(config);
  await testConnection();
  startScanJobWorker();
  logger.info("worker.started", { interval_ms: config.worker.intervalMs });
  installProcessHandlers(async () => {
    stopScanJobWorker();
    await sequelize.close();
  });
};

module.exports = { startWorker };
