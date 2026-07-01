const logger = require("../utils/logger");

const installProcessHandlers = (shutdown) => {
  let stopping = false;
  const stop = async (reason, error) => {
    if (stopping) return;
    stopping = true;
    logger.warn("runtime.shutdown.started", {
      reason,
      error: error ? { name: error.name, message: error.message, stack: error.stack } : undefined,
    });
    try {
      await shutdown();
      logger.info("runtime.shutdown.completed", { reason });
      process.exitCode = error ? 1 : 0;
    } catch (shutdownError) {
      logger.error("runtime.shutdown.failed", { reason, error: shutdownError });
      process.exitCode = 1;
    }
  };

  process.once("SIGTERM", () => stop("SIGTERM"));
  process.once("SIGINT", () => stop("SIGINT"));
  process.once("unhandledRejection", (error) => stop("unhandledRejection", error instanceof Error ? error : new Error(String(error))));
  process.once("uncaughtException", (error) => stop("uncaughtException", error));
  return stop;
};

module.exports = { installProcessHandlers };
