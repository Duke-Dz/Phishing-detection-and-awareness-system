const config = require("../config/env");
const { sequelize, testConnection } = require("../config/sequelize");
const {
  startPendingRegistrationCleanup,
  stopPendingRegistrationCleanup,
} = require("../services/pendingRegistrationService");
const { startScanJobWorker, stopScanJobWorker } = require("../services/scanJobService");
const logger = require("../utils/logger");
const { installProcessHandlers } = require("./lifecycle");

require("../models");

const startWorker = async () => {
  config.validateConfig(config);
  await testConnection();
  startScanJobWorker();
  startPendingRegistrationCleanup();
  logger.info("worker.started", { interval_ms: config.worker.intervalMs });
  installProcessHandlers(async () => {
    stopPendingRegistrationCleanup();
    stopScanJobWorker();
    await sequelize.close();
  });
};

module.exports = { startWorker };
