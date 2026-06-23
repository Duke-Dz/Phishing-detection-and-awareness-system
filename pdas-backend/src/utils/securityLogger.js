const { SecurityEvent } = require("../models");

/**
 * Log a security event
 * TODO: Implement a scheduled cron job or worker to prune security events older than 90 days.
 *
 * @param {string} userId - UUID of the user
 * @param {string} eventType - The type of security event (from enum)
 * @param {object} req - Express request object to extract IP and user agent
 * @param {object} metadata - Additional context about the event
 */
const logSecurityEvent = async (userId, eventType, req = null, metadata = {}) => {
  try {
    let ip_address = null;
    let user_agent = null;

    if (req) {
      ip_address = req.ip || req.connection?.remoteAddress || null;
      user_agent = req.headers['user-agent'] || null;
    }

    await SecurityEvent.create({
      user_id: userId || null,
      event_type: eventType,
      ip_address,
      user_agent,
      metadata
    });
  } catch (error) {
    console.error("[SecurityEvent Logger Error]: Failed to log event", eventType, error);
  }
};

module.exports = {
  logSecurityEvent
};
