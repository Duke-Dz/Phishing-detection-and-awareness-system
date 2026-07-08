const { Op } = require("sequelize");
const { PendingRegistration } = require("../models");
const config = require("../config/env");
const logger = require("../utils/logger");

let cleanupTimer = null;

const cleanupExpiredPendingRegistrations = async (now = new Date()) => {
  const deleted = await PendingRegistration.destroy({
    where: {
      expires_at: { [Op.lte]: now },
    },
  });

  if (deleted > 0) {
    logger.info("pending_registrations.cleanup", { deleted });
  }

  return deleted;
};

const startPendingRegistrationCleanup = () => {
  if (cleanupTimer) return cleanupTimer;

  const intervalMs = Math.max(
    1,
    config.performance.pendingRegistrationCleanupIntervalMinutes,
  ) * 60 * 1000;

  cleanupExpiredPendingRegistrations().catch((error) => {
    logger.warn("pending_registrations.cleanup_failed", {
      error: error.message,
    });
  });

  cleanupTimer = setInterval(() => {
    cleanupExpiredPendingRegistrations().catch((error) => {
      logger.warn("pending_registrations.cleanup_failed", {
        error: error.message,
      });
    });
  }, intervalMs);
  cleanupTimer.unref?.();

  logger.info("pending_registrations.cleanup_started", { interval_ms: intervalMs });
  return cleanupTimer;
};

const stopPendingRegistrationCleanup = () => {
  if (!cleanupTimer) return;
  clearInterval(cleanupTimer);
  cleanupTimer = null;
};

module.exports = {
  cleanupExpiredPendingRegistrations,
  startPendingRegistrationCleanup,
  stopPendingRegistrationCleanup,
};
