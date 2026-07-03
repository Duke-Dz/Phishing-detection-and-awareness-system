const { Op } = require("sequelize");
const { sequelize } = require("../config/sequelize");
const {
  AwarenessContent,
  Notification,
  Report,
  ScanJob,
  ScanResult,
  ThreatIntelligence,
  User,
} = require("../models");
const { createError, requireFields } = require("../utils/inputValidation");
const { buildPaginationMeta, getPagination } = require("../utils/pagination");
const { getApiStatus } = require("../services/externalThreatService");
const { clearUserCache } = require("../middleware/authMiddleware");

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
  clearUserCache(user.user_id);

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
    reputation_score: req.body.reputation_score ?? 80,
    is_blacklisted: req.body.is_blacklisted ?? false,
    blacklist_sources: req.body.blacklist_sources || ["manual"],
    threat_type: req.body.threat_type || "unknown",
  });

  res.status(201).json({
    success: true,
    data: threat,
  });
};

const updateThreatIntel = async (req, res) => {
  const threat = await ThreatIntelligence.findByPk(req.params.threatId);
  if (!threat) {
    throw createError("Threat intelligence entry not found", 404);
  }

  const allowedFields = ["domain", "reputation_score", "is_blacklisted", "blacklist_sources", "threat_type"];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = field === "domain"
        ? String(req.body[field]).toLowerCase()
        : req.body[field];
    }
  }

  await threat.update(updates);

  res.json({
    success: true,
    data: threat,
  });
};

const deleteThreatIntel = async (req, res) => {
  const threat = await ThreatIntelligence.findByPk(req.params.threatId);
  if (!threat) {
    throw createError("Threat intelligence entry not found", 404);
  }

  await threat.destroy();

  res.json({
    success: true,
    message: "Threat intelligence entry deleted.",
  });
};

const getAnalytics = async (_req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [dailyScans, classificationBreakdown, topDomains, userGrowth] = await Promise.all([
    // Daily scan counts for last 30 days
    ScanResult.findAll({
      where: { analyzed_at: { [Op.gte]: thirtyDaysAgo } },
      attributes: [
        [sequelize.fn("DATE", sequelize.col("analyzed_at")), "date"],
        [sequelize.fn("COUNT", sequelize.col("scan_id")), "count"],
      ],
      group: [sequelize.fn("DATE", sequelize.col("analyzed_at"))],
      order: [[sequelize.fn("DATE", sequelize.col("analyzed_at")), "ASC"]],
      raw: true,
    }),

    // Classification breakdown over last 30 days
    ScanResult.findAll({
      where: { analyzed_at: { [Op.gte]: thirtyDaysAgo } },
      attributes: [
        "classification",
        [sequelize.fn("COUNT", sequelize.col("scan_id")), "count"],
      ],
      group: ["classification"],
      raw: true,
    }),

    // Top 10 targeted domains
    ScanResult.findAll({
      where: {
        scan_type: "url",
        analyzed_at: { [Op.gte]: thirtyDaysAgo },
      },
      attributes: [
        "target",
        [sequelize.fn("COUNT", sequelize.col("scan_id")), "count"],
      ],
      group: ["target"],
      order: [[sequelize.fn("COUNT", sequelize.col("scan_id")), "DESC"]],
      limit: 10,
      raw: true,
    }),

    // User growth over last 30 days
    User.findAll({
      where: { created_at: { [Op.gte]: thirtyDaysAgo } },
      attributes: [
        [sequelize.fn("DATE", sequelize.col("created_at")), "date"],
        [sequelize.fn("COUNT", sequelize.col("user_id")), "count"],
      ],
      group: [sequelize.fn("DATE", sequelize.col("created_at"))],
      order: [[sequelize.fn("DATE", sequelize.col("created_at")), "ASC"]],
      raw: true,
    }),
  ]);

  res.json({
    success: true,
    data: {
      dailyScans,
      classificationBreakdown,
      topDomains,
      userGrowth,
    },
  });
};

const getExternalApiStatus = async (_req, res) => {
  res.json({
    success: true,
    data: getApiStatus(),
  });
};

module.exports = {
  createThreatIntel,
  deleteThreatIntel,
  getAnalytics,
  getDashboardStats,
  getExternalApiStatus,
  listUsers,
  updateUser,
  listThreatIntel,
  updateThreatIntel,
};
