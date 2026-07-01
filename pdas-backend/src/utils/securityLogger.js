const logger = require("./logger");

const normalizeEvent = (userIdOrEvent, eventType, req, metadata) => {
  if (userIdOrEvent && typeof userIdOrEvent === "object") {
    return {
      user_id: userIdOrEvent.user_id || null,
      event_type: userIdOrEvent.event_type,
      ip_address: userIdOrEvent.ip_address || null,
      user_agent: userIdOrEvent.user_agent || null,
      metadata: logger.redact(userIdOrEvent.metadata || {}),
    };
  }
  return {
    user_id: userIdOrEvent || null,
    event_type: eventType,
    ip_address: req?.ip || req?.connection?.remoteAddress || null,
    user_agent: req?.get?.("user-agent") || req?.headers?.["user-agent"] || null,
    metadata: logger.redact({ ...(metadata || {}), request_id: req?.id }),
  };
};

const createSecurityLogger = (SecurityEvent) => {
  const logSecurityEvent = async (...args) => {
    const event = normalizeEvent(...args);
    try {
      const record = await SecurityEvent.create(event);
      logger.info("security.event.recorded", {
        event_type: event.event_type,
        user_id: event.user_id,
        request_id: event.metadata.request_id,
      });
      return record;
    } catch (error) {
      logger.error("security.event.failed", {
        event_type: event.event_type,
        user_id: event.user_id,
        error,
      });
      return null;
    }
  };
  return { logSecurityEvent };
};

const { SecurityEvent } = require("../models");

module.exports = {
  ...createSecurityLogger(SecurityEvent),
  createSecurityLogger,
  normalizeEvent,
};
