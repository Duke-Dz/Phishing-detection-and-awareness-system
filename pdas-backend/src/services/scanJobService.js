const { Op } = require("sequelize");
const { ScanJob } = require("../models");
const { sequelize } = require("../config/sequelize");
const { analyzeMessage, analyzeUrl } = require("./detectionService");
const { createScanNotification } = require("./notificationService");
const { persistScanResult } = require("./scanPersistenceService");
const logger = require("../utils/logger");

let workerTimer = null;
let running = false;

const createScanJob = ({ user_id, report_id = null, scan_type, target }) =>
  ScanJob.create({
    user_id,
    report_id,
    scan_type,
    target,
  });

const runAnalysis = (job) => {
  if (job.scan_type === "url") {
    return analyzeUrl(job.target);
  }

  return analyzeMessage(job.target, job.scan_type);
};

const claimQueuedJobs = async (batchSize, maxAttempts) =>
  sequelize.transaction(async (transaction) => {
    const jobs = await ScanJob.findAll({
      where: {
        status: "queued",
        attempts: { [Op.lt]: maxAttempts },
      },
      order: [["created_at", "ASC"]],
      limit: batchSize,
      lock: transaction.LOCK.UPDATE,
      skipLocked: true,
      transaction,
    });

    for (const job of jobs) {
      job.status = "processing";
      job.started_at = new Date();
      job.attempts += 1;
      await job.save({ transaction });
    }

    return jobs;
  });

const processJob = async (job) => {
  try {
    const analysis = await runAnalysis(job);
    const scanResult = await persistScanResult({
      user_id: job.user_id,
      report_id: job.report_id,
      analysis,
    });

    await createScanNotification({
      user_id: job.user_id,
      scanResult,
      report_id: scanResult.report_id,
    });

    job.status = "completed";
    job.scan_id = scanResult.scan_id;
    job.completed_at = new Date();
    job.last_error = null;
    await job.save();
  } catch (error) {
    job.status = job.attempts >= job.max_attempts ? "failed" : "queued";
    job.last_error = error.message;
    await job.save();
    logger.warn(`Scan job ${job.job_id} failed: ${error.message}`);
  }
};

const processQueuedScanJobs = async () => {
  if (running) {
    return;
  }

  running = true;
  try {
    const batchSize = Number.parseInt(process.env.SCAN_WORKER_BATCH_SIZE || "5", 10);
    const maxAttempts = Number.parseInt(process.env.SCAN_JOB_MAX_ATTEMPTS || "3", 10);
    const jobs = await claimQueuedJobs(batchSize, maxAttempts);

    for (const job of jobs) {
      await processJob(job);
    }
  } finally {
    running = false;
  }
};

const startScanJobWorker = () => {
  if (workerTimer || process.env.SCAN_WORKER_ENABLED === "false") {
    return null;
  }

  const intervalMs = Number.parseInt(process.env.SCAN_WORKER_INTERVAL_MS || "5000", 10);
  workerTimer = setInterval(() => {
    processQueuedScanJobs().catch((error) => {
      logger.error(`Scan worker failed: ${error.message}`);
    });
  }, intervalMs);

  if (process.env.WORKER_ONLY !== "true") {
    workerTimer.unref();
  }
  logger.info(`Scan job worker started with ${intervalMs}ms interval`);
  return workerTimer;
};

const stopScanJobWorker = () => {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }
};

module.exports = {
  createScanJob,
  processQueuedScanJobs,
  startScanJobWorker,
  stopScanJobWorker,
};
