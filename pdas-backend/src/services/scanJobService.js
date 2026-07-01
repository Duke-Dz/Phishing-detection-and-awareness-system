const { Op } = require("sequelize");
const { ScanJob } = require("../models");
const { sequelize } = require("../config/sequelize");
const { analyzeMessage, analyzeUrl } = require("./detectionService");
const { createScanNotification } = require("./notificationService");
const { persistScanResult } = require("./scanPersistenceService");
const logger = require("../utils/logger");
const config = require("../config/env");

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

    await Promise.all(jobs.map(async (job) => {
      job.status = "processing";
      job.started_at = new Date();
      job.attempts += 1;
      await job.save({ transaction });
    }));

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
    const batchSize = config.worker.batchSize;
    const maxAttempts = config.worker.maxAttempts;
    const jobs = await claimQueuedJobs(batchSize, maxAttempts);

    await Promise.allSettled(jobs.map((job) => processJob(job)));
  } finally {
    running = false;
  }
};

const startScanJobWorker = () => {
  if (workerTimer) {
    return null;
  }

  const intervalMs = config.worker.intervalMs;
  workerTimer = setInterval(() => {
    processQueuedScanJobs().catch((error) => {
      logger.error(`Scan worker failed: ${error.message}`);
    });
  }, intervalMs);

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
