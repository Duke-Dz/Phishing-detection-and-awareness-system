require("dotenv").config();

const fs = require("fs");
const https = require("https");
const app = require("./src/app");
const { sequelize, testConnection } = require("./src/config/sequelize");
const { startScanJobWorker, stopScanJobWorker } = require("./src/services/scanJobService");
const logger = require("./src/utils/logger");

require("./src/models");

const PORT = process.env.PORT || 5000;

let server;

const startServer = async () => {
  try {
    await testConnection();
    const syncAlter =
      process.env.DB_SYNC_ALTER === "true" ||
      (process.env.NODE_ENV !== "production" && process.env.DB_SYNC_ALTER !== "false");
    await sequelize.sync({ alter: syncAlter });
    logger.info("Database tables synced");
    startScanJobWorker();

    if (process.env.WORKER_ONLY === "true") {
      logger.info("Worker-only process started");
      return;
    }

    if (process.env.HTTPS_ENABLED === "true") {
      if (!process.env.HTTPS_KEY_PATH || !process.env.HTTPS_CERT_PATH) {
        throw new Error("HTTPS_KEY_PATH and HTTPS_CERT_PATH are required when HTTPS_ENABLED=true");
      }

      server = https
        .createServer(
          {
            key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
            cert: fs.readFileSync(process.env.HTTPS_CERT_PATH),
          },
          app,
        )
        .listen(PORT, () => {
          logger.info(`HTTPS server running on port ${PORT}`);
          logger.info(`Environment: ${process.env.NODE_ENV}`);
          logger.info(`Health check: https://localhost:${PORT}/api/health`);
        });

      return;
    }

    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error(`Startup failed: ${error.message}`);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.warn(`${signal} received. Shutting down gracefully.`);
  stopScanJobWorker();
  if (server) {
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  } else {
    await sequelize.close();
    process.exit(0);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled rejection: ${reason}`);
  shutdown("unhandledRejection");
});

startServer();
