const { Op } = require("sequelize");
const { sequelize } = require("../config/sequelize");
const { ScanResult, Report, Notification } = require("../models");

const getUserDashboardStats = async (req, res) => {
  const userId = req.user.user_id;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalScans,
    phishingScans,
    suspiciousScans,
    safeScans,
    recentScans,
    totalReports,
    unreadNotifications,
    scansByType,
  ] = await Promise.all([
    ScanResult.count({ where: { user_id: userId } }),
    ScanResult.count({ where: { user_id: userId, classification: "phishing" } }),
    ScanResult.count({ where: { user_id: userId, classification: "suspicious" } }),
    ScanResult.count({ where: { user_id: userId, classification: "safe" } }),
    ScanResult.count({
      where: { user_id: userId, analyzed_at: { [Op.gte]: sevenDaysAgo } },
    }),
    Report.count({ where: { user_id: userId } }),
    Notification.count({ where: { user_id: userId, is_read: false } }),
    ScanResult.findAll({
      where: { user_id: userId },
      attributes: [
        "scan_type",
        [sequelize.fn("COUNT", sequelize.col("scan_id")), "count"],
      ],
      group: ["scan_type"],
      raw: true,
    }),
  ]);

  // Get recent activity (last 7 days, daily counts)
  const recentActivity = await ScanResult.findAll({
    where: {
      user_id: userId,
      analyzed_at: { [Op.gte]: sevenDaysAgo },
    },
    attributes: [
      [sequelize.fn("DATE", sequelize.col("analyzed_at")), "date"],
      [sequelize.fn("COUNT", sequelize.col("scan_id")), "count"],
    ],
    group: [sequelize.fn("DATE", sequelize.col("analyzed_at"))],
    order: [[sequelize.fn("DATE", sequelize.col("analyzed_at")), "ASC"]],
    raw: true,
  });

  const typeBreakdown = {};
  for (const row of scansByType) {
    typeBreakdown[row.scan_type] = parseInt(row.count, 10);
  }

  res.json({
    success: true,
    data: {
      totalScans,
      phishingScans,
      suspiciousScans,
      safeScans,
      recentScans,
      totalReports,
      unreadNotifications,
      scanTypeBreakdown: typeBreakdown,
      recentActivity,
    },
  });
};

module.exports = { getUserDashboardStats };
