const nodemailer = require("nodemailer");
const config = require("../config/env");
const logger = require("../utils/logger");
const { generateUnsubscribeToken } = require("../utils/unsubscribeTokens");

let transporter = null;

/**
 * Asynchronously verify the connection to the SMTP server.
 */
async function verifyConnection(transport) {
  try {
    await transport.verify();
    logger.info("Mail service connection verified successfully");
  } catch (error) {
    logger.error("Mail service connection verification failed", {
      error: error.message,
      host: config.mail.host,
      port: config.mail.port,
    });
  }
}

/**
 * Creates a nodemailer transporter if mail is configured.
 */
function createTransporter() {
  if (!config.mail.host || !config.mail.user) {
    logger.warn("Mail service is not fully configured (missing host or user).");
    return null;
  }

  const transport = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.port === 465, // true for 465, false for other ports
    auth: {
      user: config.mail.user,
      pass: config.mail.pass,
    },
    // Prevent long hangs during DNS/connection
    connectionTimeout: 10000,
    // Force IPv4 to prevent 2-minute DNS resolution timeouts (Node 17+ issue with IPv6 and Mailtrap)
    family: 4,
  });

  logger.info(
    `Mail service initialized (${config.mail.host}:${config.mail.port})`
  );

  // Non-blocking verification check
  verifyConnection(transport);

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
    const unsubscribeToken = generateUnsubscribeToken(to);
    const unsubscribeUrl = `${config.frontendUrl}/unsubscribe?email=${encodeURIComponent(to)}&token=${unsubscribeToken}`;
    const privacyUrl = `${config.frontendUrl}/privacy`;

    const finalHtml = html ? html.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl).replace(/\{\{PRIVACY_URL\}\}/g, privacyUrl) : html;
    const finalText = text ? text.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl).replace(/\{\{PRIVACY_URL\}\}/g, privacyUrl) : text;

    const info = await transporter.sendMail({
      from: config.mail.from,
      to,
      subject,
      html: finalHtml,
      text: finalText,
    });
    
    logger.info(`Email sent successfully to ${to}`, { messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error("Failed to send email", {
      to,
      subject,
      error: error.message,
      stack: error.stack,
    });
    return null;
  }
}

module.exports = { isMailConfigured, sendMail };
