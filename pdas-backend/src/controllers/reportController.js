const fs = require("fs");
const path = require("path");
const { Report, ScanResult, User } = require("../models");
const { analyzeMessage, analyzeUrl } = require("../services/detectionService");
const { createNotification, createScanNotification } = require("../services/notificationService");
const { createError, requireFields, validateUrl } = require("../utils/validators");
const { buildPaginationMeta, getPagination } = require("../utils/pagination");
const { sendMail } = require("../services/mailService");
const emailTemplates = require("../templates/emailTemplates");
const config = require("../config/env");

const analyzeByType = async (reportType, content) => {
  if (reportType === "url") {
    return analyzeUrl(validateUrl(content));
  }

  return analyzeMessage(content, reportType);
};

const getRequestedReportId = (req) => req.params.reportId || req.params.id;

const canAccessReport = (user, report) =>
  ["admin", "analyst"].includes(user.role) || report.user_id === user.user_id;

const requireReportAccess = async (req, _res, next) => {
  try {
    const report = await Report.findByPk(getRequestedReportId(req));
    if (!report) {
      throw createError("Report not found", 404);
    }

    if (!canAccessReport(req.user, report)) {
      throw createError("Not authorized", 403);
    }

    req.report = report;
    next();
  } catch (error) {
    next(error);
  }
};

const createReport = async (req, res) => {
  requireFields(req.body, ["report_type", "content"]);

  if (!["url", "email", "sms"].includes(req.body.report_type)) {
    throw createError("report_type must be url, email, or sms");
  }

  const report = await Report.create({
    user_id: req.user.user_id,
    report_type: req.body.report_type,
    content: req.body.content,
    notes: req.body.notes || null,
  });

  const analysis = await analyzeByType(req.body.report_type, req.body.content);
  const scanResult = await ScanResult.create({
    user_id: req.user.user_id,
    report_id: report.report_id,
    target: analysis.target,
    scan_type: analysis.scan_type,
    risk_score: analysis.risk_score,
    classification: analysis.classification,
    detection_details: analysis.detection_details,
    engine_version: analysis.detection_details?.engine_version,
  });

  await createScanNotification({
    user_id: req.user.user_id,
    scanResult,
    report_id: report.report_id,
  });

  res.status(201).json({
    success: true,
    data: {
      report,
      scanResult,
    },
  });
};

const listReports = async (req, res) => {
  const pagination = getPagination(req.query);
  const where = ["admin", "analyst"].includes(req.user.role)
    ? {}
    : { user_id: req.user.user_id };

  const { count, rows: reports } = await Report.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit: pagination.limit,
    offset: pagination.offset,
    distinct: true,
    include: [
      { model: ScanResult, as: "scanResult" },
      { model: User, as: "author", attributes: ["user_id", "full_name", "email", "role"] },
    ],
  });

  res.json({
    success: true,
    count: reports.length,
    pagination: buildPaginationMeta({ count, ...pagination }),
    data: reports,
  });
};

const getReport = async (req, res) => {
  const report = await Report.findByPk(req.params.reportId, {
    include: [{ model: ScanResult, as: "scanResult" }],
  });

  if (!report) {
    throw createError("Report not found", 404);
  }

  if (req.user.role === "user" && report.user_id !== req.user.user_id) {
    throw createError("You cannot view this report", 403);
  }

  res.json({
    success: true,
    data: report,
  });
};

const updateReportStatus = async (req, res) => {
  requireFields(req.body, ["status"]);

  if (!["pending", "under_review", "confirmed", "false_positive"].includes(req.body.status)) {
    throw createError("Invalid report status");
  }

  const report = await Report.findByPk(req.params.reportId);
  if (!report) {
    throw createError("Report not found", 404);
  }

  report.status = req.body.status;
  await report.save();

  await createNotification({
    user_id: report.user_id,
    title: "Report status updated",
    message: `Your report status is now ${report.status}.`,
    type: report.status === "confirmed" ? "alert" : "info",
    related_report_id: report.report_id,
  });

  // Send status update email to report author
  try {
    const reportAuthor = await User.findByPk(report.user_id);
    if (reportAuthor) {
      const template = emailTemplates.reportStatusUpdate({
        userName: reportAuthor.full_name,
        reportId: report.report_id,
        newStatus: report.status,
        notes: req.body.notes || null,
        frontendUrl: config.frontendUrl,
      });
      sendMail({ to: reportAuthor.email, ...template }).catch(() => {});
    }
  } catch (_error) {
    // Don't break status update if email fails
  }

  res.json({
    success: true,
    data: report,
  });
};

const uploadAttachment = async (req, res) => {
  if (!req.file) {
    throw createError("No file uploaded", 400);
  }

  const report = req.report;
  const attachmentUrl = `/api/reports/${report.report_id}/attachments/${req.file.filename}`;

  const attachments = report.attachments || [];
  attachments.push(attachmentUrl);
  report.attachments = attachments;

  report.changed("attachments", true);
  await report.save();

  res.json({
    success: true,
    message: "Attachment uploaded successfully",
    attachment_url: attachmentUrl,
  });
};

const getAttachment = async (req, res) => {
  const report = req.report;
  const requestedUrl = `/api/reports/${report.report_id}/attachments/${req.params.filename}`;
  const legacyUrl = `/uploads/reports/${req.params.filename}`;
  const attachments = report.attachments || [];

  if (!attachments.includes(requestedUrl) && !attachments.includes(legacyUrl)) {
    throw createError("Attachment not found", 404);
  }

  const uploadRoot = path.resolve("uploads", "reports");
  const filePath = path.resolve(uploadRoot, req.params.filename);
  if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) {
    throw createError("Invalid attachment path", 400);
  }
  if (!fs.existsSync(filePath)) {
    throw createError("Attachment file not found", 404);
  }

  res.sendFile(filePath);
};

module.exports = {
  createReport,
  getAttachment,
  listReports,
  requireReportAccess,
  getReport,
  updateReportStatus,
  uploadAttachment,
};
