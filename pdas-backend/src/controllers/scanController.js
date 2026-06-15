const { Op } = require("sequelize");
const { ScanJob, ScanResult } = require("../models");
const { analyzeMessage, analyzeUrl } = require("../services/detectionService");
const { createScanNotification } = require("../services/notificationService");
const { persistScanResult } = require("../services/scanPersistenceService");
const { createScanJob } = require("../services/scanJobService");
const { createError, requireFields, validateUrl } = require("../utils/validators");
const { buildPaginationMeta, getPagination } = require("../utils/pagination");
const cacheService = require("../services/cacheService");

const persistScan = async ({ user_id, report_id = null, analysis }) => {
  const scanResult = await persistScanResult({ user_id, report_id, analysis });

  await createScanNotification({ user_id, scanResult, report_id: scanResult.report_id });

  // Invalidate dashboard cache so new scan appears in stats immediately
  cacheService.del(cacheService.keys.dashboardStats(user_id));

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

  const analysis = await analyzeMessage(req.body.content, "sms", {
    sender: req.body.sender || null,
  });
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

const listScans = async (req, res) => {
  const pagination = getPagination(req.query);
  const where = ["admin", "analyst"].includes(req.user.role)
    ? {}
    : { user_id: req.user.user_id };

  // Optional filters
  if (req.query.scan_type) {
    where.scan_type = req.query.scan_type;
  }
  if (req.query.classification) {
    where.classification = req.query.classification;
  }
  if (req.query.date_from || req.query.date_to) {
    where.analyzed_at = {};
    if (req.query.date_from) {
      where.analyzed_at[Op.gte] = new Date(req.query.date_from);
    }
    if (req.query.date_to) {
      where.analyzed_at[Op.lte] = new Date(req.query.date_to);
    }
  }

  const { count, rows: scans } = await ScanResult.findAndCountAll({
    where,
    order: [["analyzed_at", "DESC"]],
    limit: pagination.limit,
    offset: pagination.offset,
    attributes: ["scan_id", "target", "scan_type", "risk_score", "classification", "engine_version", "analyzed_at"],
  });

  res.json({
    success: true,
    count: scans.length,
    pagination: buildPaginationMeta({ count, ...pagination }),
    data: scans,
  });
};

module.exports = { listScans, scanUrl, scanSms, getScan, getScanJob, persistScan };
