const { Notification, User } = require("../models");
const { sendMail } = require("./mailService");
const emailTemplates = require("../templates/emailTemplates");
const config = require("../config/env");
const sseService = require("./sseService");
const cacheService = require("./cacheService");

const scanTypeLabel = (value) => ({ url: "URL", email: "Email", sms: "SMS" }[value] || "Content");

const buildScanNotification = (scanResult) => {
  const classification = String(scanResult.classification || "suspicious").toLowerCase();
  const score = Math.max(0, Math.min(100, Math.round(Number(scanResult.risk_score) || 0)));
  const label = scanTypeLabel(scanResult.scan_type);
  const feedback = scanResult.detection_details?.user_feedback || scanResult.user_feedback || {};
  const verdict = String(feedback.verdict || "").trim();
  const action = String(feedback.recommended_action || "").trim();

  const content = {
    safe: {
      title: `${label} scan: no strong threats detected`,
      fallback: "No strong known threat indicators were found. Continue with normal caution.",
      type: "success",
    },
    suspicious: {
      title: `${label} scan needs your review`,
      fallback: "Suspicious indicators were found. Verify the sender or destination before taking action.",
      type: "warning",
    },
    phishing: {
      title: `Phishing warning from ${label} scan`,
      fallback: "Strong phishing indicators were detected. Do not click links, reply, or provide sensitive information.",
      type: "alert",
    },
  }[classification] || {
    title: `${label} scan result available`,
    fallback: "Review the scan result before interacting with this content.",
    type: "info",
  };

  const guidance = [verdict || content.fallback, action]
    .filter(Boolean)
    .filter((value, index, values) => index === 0 || value !== values[0])
    .join(" ");

  return {
    title: content.title,
    message: `Risk score ${score}/100. ${guidance}`.slice(0, 900),
    type: content.type,
  };
};

const createNotification = async ({ user_id, title, message, type = "info", related_report_id }) => {
  const notification = await Notification.create({
    user_id,
    title,
    message,
    type,
    related_report_id,
  });
  cacheService.del(cacheService.keys.dashboardStats(user_id));
  cacheService.del(cacheService.keys.systemStats());
  cacheService.delByPrefix(`notifications:${user_id}:`);

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

  const content = buildScanNotification(scanResult);
  const notification = await createNotification({
    user_id,
    ...content,
    related_report_id: report_id,
  });

  // Send phishing alert email
  if (scanResult.classification === "phishing") {
    try {
      const user = await User.findByPk(user_id);
      if (user?.email_notifications !== false) {
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

module.exports = { buildScanNotification, createNotification, createScanNotification };
