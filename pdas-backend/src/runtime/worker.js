const config = require("../config/env");
const { sequelize, testConnection } = require("../config/sequelize");
const { cleanupExpiredPendingRegistrations } = require("../services/pendingRegistrationService");
const { startScanJobWorker, stopScanJobWorker } = require("../services/scanJobService");
const logger = require("../utils/logger");
const { installProcessHandlers } = require("./lifecycle");

require("../models");

let pendingCleanupTimer = null;

const startWorker = async () => {
  config.validateConfig(config);
  await testConnection();
  startScanJobWorker();
  await cleanupExpiredPendingRegistrations();
  pendingCleanupTimer = setInterval(() => {
    cleanupExpiredPendingRegistrations().catch((error) => {
      logger.warn("pending_registrations.cleanup_failed", { error: error.message });
    });
  }, 15 * 60 * 1000);
  logger.info("worker.started", { interval_ms: config.worker.intervalMs });
  installProcessHandlers(async () => {
    if (pendingCleanupTimer) clearInterval(pendingCleanupTimer);
    stopScanJobWorker();
    await sequelize.close();
  });
};

module.exports = { startWorker };
