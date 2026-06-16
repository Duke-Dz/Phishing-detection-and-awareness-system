const { Notification, User } = require("../models");
const { sendMail } = require("./mailService");
const emailTemplates = require("../templates/emailTemplates");
const config = require("../config/env");
const sseService = require("./sseService");

const createNotification = async ({ user_id, title, message, type = "info", related_report_id }) => {
  const notification = await Notification.create({
    user_id,
    title,
    message,
    type,
    related_report_id,
  });

  // Push real-time notification via SSE (fire-and-forget)
  sseService.sendToUser(user_id, "notification", {
    notification_id: notification.notification_id,
    title,
    message,
    type,
    related_report_id,
    created_at: notification.created_at,
  });

  return notification;
};

const createScanNotification = async ({ user_id, scanResult, report_id }) => {
  if (!user_id) return null;

  const type = scanResult.classification === "phishing" ? "alert" : "info";
  const notification = await createNotification({
    user_id,
    title: "Scan completed",
    message: `Your ${scanResult.scan_type} scan was classified as ${scanResult.classification} with a risk score of ${scanResult.risk_score}.`,
    type,
    related_report_id: report_id,
  });

  // Send phishing alert email
  if (scanResult.classification === "phishing") {
    try {
      const user = await User.findByPk(user_id);
      if (user) {
        const details = scanResult.detection_details || {};
        const layers = details.layers || {};
        
        // Extract signals from all active layers
        const allSignals = [
          ...(layers.rules?.signals || []),
          ...(layers.blacklist?.signals || []),
          ...(layers.content?.signals || []),
        ].map(s => s.name || s.evidence).filter(Boolean);
        
        // Extract threat feeds from external API usage
        const threatFeeds = (details.external_api_usage || []).map(a => ({
          name: a.source || a.api_name || "Unknown Source",
          verdict: a.isMalicious ? "malicious" : "clean"
        }));

        const domainAgeDays = details.domain_age_days;
        const domainAge = domainAgeDays 
          ? `${domainAgeDays} day${domainAgeDays === 1 ? "" : "s"}` 
          : null;

        const template = emailTemplates.phishingAlert({
          userName: user.full_name,
          target: scanResult.target,
          riskScore: scanResult.risk_score,
          classification: scanResult.classification,
          scanId: scanResult.scan_id,
          scanType: scanResult.scan_type || "url",
          scannedAt: scanResult.created_at || new Date(),
          detectedSignals: [...new Set(allSignals)],
          threatFeeds,
          domainAge,
          frontendUrl: config.frontendUrl,
        });
        sendMail({ to: user.email, ...template }).catch(() => {});
      }
    } catch (_error) {
      // Email sending should never break the scan flow
    }
  }

  return notification;
};

module.exports = { createNotification, createScanNotification };
