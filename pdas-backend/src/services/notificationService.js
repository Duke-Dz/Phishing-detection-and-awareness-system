const { Notification } = require("../models");

const createNotification = async ({ user_id, title, message, type = "info", related_report_id }) =>
  Notification.create({
    user_id,
    title,
    message,
    type,
    related_report_id,
  });

const createScanNotification = async ({ user_id, scanResult, report_id }) => {
  if (!user_id) return null;

  const type = scanResult.classification === "phishing" ? "alert" : "info";
  return createNotification({
    user_id,
    title: "Scan completed",
    message: `Your ${scanResult.scan_type} scan was classified as ${scanResult.classification} with a risk score of ${scanResult.risk_score}.`,
    type,
    related_report_id: report_id,
  });
};

module.exports = { createNotification, createScanNotification };
