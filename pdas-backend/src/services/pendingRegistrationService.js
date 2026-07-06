const { Op } = require("sequelize");
const { PendingRegistration } = require("../models");
const logger = require("../utils/logger");

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

module.exports = { cleanupExpiredPendingRegistrations };
