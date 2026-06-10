const { Op } = require("sequelize");
const {
  AwarenessContent,
  Notification,
  Report,
  ScanJob,
  ScanResult,
  ThreatIntelligence,
  User,
} = require("../models");
const { createError, requireFields } = require("../utils/validators");
const { buildPaginationMeta, getPagination } = require("../utils/pagination");
const { getApiStatus } = require("../services/externalThreatService");

const getDashboardStats = async (_req, res) => {
  const [
    totalUsers,
    totalReports,
    queuedScanJobs,
    failedScanJobs,
    phishingScans,
    suspiciousScans,
    safeScans,
    unreadNotifications,
    publishedLessons,
  ] = await Promise.all([
    User.count(),
    Report.count(),
    ScanJob.count({ where: { status: "queued" } }),
    ScanJob.count({ where: { status: "failed" } }),
    ScanResult.count({ where: { classification: "phishing" } }),
    ScanResult.count({ where: { classification: "suspicious" } }),
    ScanResult.count({ where: { classification: "safe" } }),
    Notification.count({ where: { is_read: false } }),
    AwarenessContent.count({ where: { is_published: true } }),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalReports,
      queuedScanJobs,
      failedScanJobs,
      phishingScans,
      suspiciousScans,
      safeScans,
      unreadNotifications,
      publishedLessons,
    },
  });
};

const listUsers = async (req, res) => {
  const search = req.query.search || "";
  const pagination = getPagination(req.query);
  const where = search
    ? {
        [Op.or]: [
          { full_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ],
      }
    : {};

  const { count, rows: users } = await User.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit: pagination.limit,
    offset: pagination.offset,
  });

  res.json({
    success: true,
    count: users.length,
    pagination: buildPaginationMeta({ count, ...pagination }),
    data: users,
  });
};

const updateUser = async (req, res) => {
  const user = await User.findByPk(req.params.userId);
  if (!user) {
    throw createError("User not found", 404);
  }

  const updates = {};

  if (req.body.role) {
    if (!["user", "analyst", "admin"].includes(req.body.role)) {
      throw createError("Invalid role");
    }
    updates.role = req.body.role;
  }

  if (typeof req.body.is_active === "boolean") {
    updates.is_active = req.body.is_active;
  }

  await user.update(updates);

  res.json({
    success: true,
    data: user,
  });
};

const listThreatIntel = async (req, res) => {
  const pagination = getPagination(req.query);
  const { count, rows: threats } = await ThreatIntelligence.findAndCountAll({
    order: [["last_seen", "DESC"]],
    limit: pagination.limit,
    offset: pagination.offset,
  });

  res.json({
    success: true,
    count: threats.length,
    pagination: buildPaginationMeta({ count, ...pagination }),
    data: threats,
  });
};

const createThreatIntel = async (req, res) => {
  requireFields(req.body, ["domain"]);

  const threat = await ThreatIntelligence.create({
    domain: String(req.body.domain).toLowerCase(),
    reputation_score: req.body.reputation_score || 80,
    is_blacklisted: Boolean(req.body.is_blacklisted),
    blacklist_sources: req.body.blacklist_sources || ["manual"],
    threat_type: req.body.threat_type || "unknown",
  });

  res.status(201).json({
    success: true,
    data: threat,
  });
};

const getExternalApiStatus = async (_req, res) => {
  res.json({
    success: true,
    data: getApiStatus(),
  });
};

module.exports = {
  getDashboardStats,
  getExternalApiStatus,
  listUsers,
  updateUser,
  listThreatIntel,
  createThreatIntel,
};
