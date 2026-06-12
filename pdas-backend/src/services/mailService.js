const nodemailer = require("nodemailer");
const config = require("../config/env");
const logger = require("../utils/logger");

let transporter = null;

/**
 * Creates a nodemailer transporter if mail is configured.
 */
function createTransporter() {
  if (!config.mail.host || !config.mail.user) {
    return null;
  }

  const transport = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.port === 465,
    auth: {
      user: config.mail.user,
      pass: config.mail.pass,
    },
  });

  logger.info(`Mail service initialized (${config.mail.host}:${config.mail.port})`);
  return transport;
}

// Initialize transporter on module load
transporter = createTransporter();

/**
 * Returns true if MAIL_HOST and MAIL_USER are both set.
 */
function isMailConfigured() {
  return !!(config.mail.host && config.mail.user);
}

/**
 * Sends an email using the configured transporter.
 * Gracefully degrades if mail is not configured or sending fails.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Plain text body
 * @returns {Promise<Object|null>} Nodemailer info object on success, null otherwise
 */
async function sendMail({ to, subject, html, text }) {
  if (!isMailConfigured() || !transporter) {
    logger.info(`Mail not configured — skipping email to ${to}: ${subject}`);
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: config.mail.from,
      to,
      subject,
      html,
      text,
    });
    return info;
  } catch (error) {
    logger.error("Failed to send email", {
      to,
      subject,
      error: error.message,
    });
    return null;
  }
}

module.exports = { isMailConfigured, sendMail };
