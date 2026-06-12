<<<<<<< HEAD
const { Notification, User } = require("../models");
const { sendMail } = require("./mailService");
const emailTemplates = require("../templates/emailTemplates");
const config = require("../config/env");
=======
const { Notification } = require("../models");
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf

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
<<<<<<< HEAD
  const notification = await createNotification({
=======
  return createNotification({
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
    user_id,
    title: "Scan completed",
    message: `Your ${scanResult.scan_type} scan was classified as ${scanResult.classification} with a risk score of ${scanResult.risk_score}.`,
    type,
    related_report_id: report_id,
  });
<<<<<<< HEAD

  // Send phishing alert email
  if (scanResult.classification === "phishing") {
    try {
      const user = await User.findByPk(user_id);
      if (user) {
        const template = emailTemplates.phishingAlert({
          userName: user.full_name,
          target: scanResult.target,
          riskScore: scanResult.risk_score,
          classification: scanResult.classification,
          scanId: scanResult.scan_id,
          frontendUrl: config.frontendUrl,
        });
        sendMail({ to: user.email, ...template }).catch(() => {});
      }
    } catch (_error) {
      // Email sending should never break the scan flow
    }
  }

  return notification;
=======
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
};

module.exports = { createNotification, createScanNotification };
