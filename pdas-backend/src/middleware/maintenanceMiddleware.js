const logger = require("../utils/logger");

/**
 * Global middleware to intercept all requests when maintenance mode is active.
 */
const maintenanceMiddleware = (req, res, next) => {
  if (process.env.MAINTENANCE_MODE === "true") {
    logger.warn(`Maintenance mode active: intercepted request to ${req.originalUrl}`);
    return res.status(503).json({
      status: "error",
      message: "The system is currently undergoing scheduled maintenance. Please try again later.",
      code: "MAINTENANCE_MODE",
    });
  }
  next();
};

module.exports = maintenanceMiddleware;
