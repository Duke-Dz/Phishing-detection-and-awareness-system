const nodemailer = require("nodemailer");
const path = require("path");
const config = require("../config/env");
const logger = require("../utils/logger");
const { generateUnsubscribeToken } = require("../utils/unsubscribeTokens");

const brandLogo = {
  filename: "cybersense-logo.png",
  path: path.resolve(__dirname, "../templates/assets/cybersense-logo.png"),
  cid: "cybersense-logo",
};

let transporter;
let state = {
  configured: Boolean(config.mail.host && config.mail.user && config.mail.pass),
  status: config.mail.host && config.mail.user && config.mail.pass ? "configured" : "disabled",
  last_attempt_at: null,
  last_success_at: null,
  last_error: null,
};

const recipientDomain = (address = "") => String(address).split("@")[1] || "invalid";

const withDeadline = (operation, timeoutMs, message) => {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(message);
      error.code = "ETIMEDOUT";
      reject(error);
    }, timeoutMs);
  });
  return Promise.race([operation, deadline]).finally(() => clearTimeout(timer));
};

const resetTransporter = () => {
  transporter?.close();
  transporter = undefined;
};

const createTransporter = () => {
  if (!state.configured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.port === 465,
      auth: { user: config.mail.user, pass: config.mail.pass },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 15000,
      family: 4,
    });
    logger.debug("mail.transport.created", { host: config.mail.host, port: config.mail.port });
  }
  return transporter;
};

const isMailConfigured = () => state.configured;
const getMailStatus = () => ({ ...state });

const verifyConnection = async () => {
  const transport = createTransporter();
  if (!transport) return false;
  try {
    await withDeadline(transport.verify(), 10000, "SMTP verification timed out");
    state = { ...state, status: "available", last_success_at: new Date().toISOString(), last_error: null };
    logger.info("mail.connection.available", { host: config.mail.host, port: config.mail.port });
    return true;
  } catch (error) {
    resetTransporter();
    state = { ...state, status: "unavailable", last_error: error.code || error.name };
    logger.warn("mail.connection.unavailable", { host: config.mail.host, port: config.mail.port, error });
    return false;
  }
};

const sendMail = async ({ to, subject, html, text, essential = false }) => {
  const transport = createTransporter();
  if (!transport) {
    logger.debug("mail.send.skipped", { reason: "not_configured", recipient_domain: recipientDomain(to) });
    return null;
  }

  state = { ...state, status: "sending", last_attempt_at: new Date().toISOString() };
  try {
    const frontendUrl = config.frontendUrl.replace(/\/$/, "");
    const unsubscribeUrl = essential
      ? null
      : `${frontendUrl}/unsubscribe#token=${encodeURIComponent(generateUnsubscribeToken(to))}`;
    const replacements = (value) => value
      ?.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl || "")
      .replace(/\{\{PRIVACY_URL\}\}/g, `${frontendUrl}/privacy`);
    const headers = essential
      ? {}
      : { "List-Unsubscribe": `<${unsubscribeUrl}>` };
    const info = await withDeadline(transport.sendMail({
      from: config.mail.from,
      to,
      subject,
      html: replacements(html),
      text: replacements(text),
      attachments: [brandLogo],
      headers,
    }), 20000, "SMTP send timed out");
    state = { ...state, status: "available", last_success_at: new Date().toISOString(), last_error: null };
    logger.info("mail.send.succeeded", { message_id: info.messageId, recipient_domain: recipientDomain(to) });
    return info;
  } catch (error) {
    resetTransporter();
    const status = ["EAUTH", "EENVELOPE"].includes(error.code) ? "rejected" : "unavailable";
    state = { ...state, status, last_error: error.code || error.name };
    logger.error("mail.send.failed", { recipient_domain: recipientDomain(to), status, error });
    throw error;
  }
};

const closeMailService = async () => {
  resetTransporter();
};

module.exports = {
  closeMailService,
  getMailStatus,
  isMailConfigured,
  sendMail,
  verifyConnection,
};
