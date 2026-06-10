const { ScanJob, ScanResult } = require("../models");
const { analyzeMessage, analyzeUrl } = require("../services/detectionService");
const { createScanNotification } = require("../services/notificationService");
const { persistScanResult } = require("../services/scanPersistenceService");
const { createScanJob } = require("../services/scanJobService");
const { createError, requireFields, validateUrl } = require("../utils/validators");

const persistScan = async ({ user_id, report_id = null, analysis }) => {
  const scanResult = await persistScanResult({ user_id, report_id, analysis });

  await createScanNotification({ user_id, scanResult, report_id: scanResult.report_id });
  return scanResult;
};

const scanUrl = async (req, res) => {
  requireFields(req.body, ["url"]);
  const url = validateUrl(req.body.url);

  if (req.query.async === "true" || req.body.async === true) {
    const job = await createScanJob({
      user_id: req.user.user_id,
      scan_type: "url",
      target: url,
    });

    return res.status(202).json({
      success: true,
      message: "URL scan queued",
      data: job,
    });
  }

  const analysis = await analyzeUrl(url);
  const scanResult = await persistScan({ user_id: req.user.user_id, analysis });

  res.status(201).json({
    success: true,
    data: scanResult,
  });
};

const scanSms = async (req, res) => {
  requireFields(req.body, ["content"]);

  if (req.query.async === "true" || req.body.async === true) {
    const job = await createScanJob({
      user_id: req.user.user_id,
      scan_type: "sms",
      target: String(req.body.content),
    });

    return res.status(202).json({
      success: true,
      message: "SMS scan queued",
      data: job,
    });
  }

  const analysis = await analyzeMessage(req.body.content, "sms");
  const scanResult = await persistScan({ user_id: req.user.user_id, analysis });

  res.status(201).json({
    success: true,
    data: scanResult,
  });
};

const getScan = async (req, res) => {
  const scanResult = await ScanResult.findByPk(req.params.scanId);
  if (!scanResult) {
    throw createError("Scan result not found", 404);
  }

  if (
    req.user.role === "user" &&
    scanResult.user_id &&
    scanResult.user_id !== req.user.user_id
  ) {
    throw createError("You cannot view this scan result", 403);
  }

  res.json({
    success: true,
    data: scanResult,
  });
};

const getScanJob = async (req, res) => {
  const job = await ScanJob.findByPk(req.params.jobId, {
    include: [{ model: ScanResult, as: "scanResult" }],
  });

  if (!job) {
    throw createError("Scan job not found", 404);
  }

  if (req.user.role === "user" && job.user_id !== req.user.user_id) {
    throw createError("You cannot view this scan job", 403);
  }

  res.json({
    success: true,
    data: job,
  });
};

module.exports = { scanUrl, scanSms, getScan, getScanJob, persistScan };
