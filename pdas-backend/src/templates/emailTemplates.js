// src/templates/emailTemplates.js
// Complete rebuilt email templates for CyberSense
// All templates include full threat context, action steps, and professional design

const BRAND = {
  name: "CyberSense",
  tagline: "Phishing Detection & Awareness Platform",
  // Dark navy header — security and trust
  header: "#0f172a",
  headerAccent: "#1e293b",
  // Electric blue accent — modern security product
  accent: "#3b82f6",
  accentDark: "#1d4ed8",
  // Semantic colors
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  warning: "#d97706",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  success: "#16a34a",
  successBg: "#f0fdf4",
  successBorder: "#bbf7d0",
  info: "#0284c7",
  infoBg: "#f0f9ff",
  infoBorder: "#bae6fd",
  // Layout
  background: "#f1f5f9",
  card: "#ffffff",
  border: "#e2e8f0",
  // Typography
  text: "#0f172a",
  textSecondary: "#475569",
  muted: "#94a3b8",
};

// ─── Security Helpers ──────────────────────────────────────────
const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeAttribute = (value = "") =>
  escapeHtml(value).replace(/`/g, "&#96;");

const normalizeUrl = (url = "") => {
  const value = String(url);
  return /^https?:\/\//i.test(value) ? value : "#";
};

// ─── Formatters ────────────────────────────────────────────────
const formatDate = (date) => {
  return new Date(date || Date.now()).toLocaleString("en-KE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Nairobi",
    timeZoneName: "short",
  });
};

const formatClassification = (classification = "") => {
  const map = {
    phishing: "PHISHING",
    suspicious: "SUSPICIOUS",
    safe: "SAFE",
  };
  return map[classification.toLowerCase()] || classification.toUpperCase();
};

// ─── Score Styling ─────────────────────────────────────────────
const getScoreStyle = (score) => {
  if (score >= 75) return { bg: BRAND.danger, color: "#ffffff", label: "HIGH RISK" };
  if (score >= 50) return { bg: BRAND.warning, color: "#ffffff", label: "MEDIUM RISK" };
  if (score >= 25) return { bg: "#ca8a04", color: "#ffffff", label: "LOW RISK" };
  return { bg: BRAND.success, color: "#ffffff", label: "SAFE" };
};

const getClassificationStyle = (classification = "") => {
  const map = {
    phishing:   { bg: BRAND.dangerBg,  border: BRAND.danger,  color: BRAND.danger,  icon: "" },
    suspicious: { bg: BRAND.warningBg, border: BRAND.warning, color: BRAND.warning, icon: "" },
    safe:       { bg: BRAND.successBg, border: BRAND.success, color: BRAND.success, icon: "" },
  };
  return map[classification.toLowerCase()] || map.suspicious;
};

// ─── Shared Components ─────────────────────────────────────────
function layout(bodyContent, preheaderText = "") {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, address=no, email=no, date=no, url=no">
  <title>${BRAND.name}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    html, body { margin: 0 !important; padding: 0 !important; height: 100% !important; width: 100% !important; }
    * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
    table { border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important; }
    img { -ms-interpolation-mode: bicubic; }
    a { text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column, .stack-column-center { display: block !important; width: 100% !important; max-width: 100% !important; }
    }
  </style>
</head>
<body width="100%" style="margin: 0; padding: 0 !important; background-color: ${BRAND.background};">
  ${preheaderText ? `<div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${escapeHtml(preheaderText)}</div>` : ""}
  <center style="width: 100%; background-color: ${BRAND.background};">
    <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BRAND.background};"><tr><td><![endif]-->
    <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;" class="email-container">
      <!--[if mso]><table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600"><tr><td><![endif]-->
      <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto; background-color: ${BRAND.card}; border-radius: 8px; overflow: hidden; border: 1px solid ${BRAND.border}; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

        <!-- ── HEADER ── -->
        <tr>
          <td style="background: linear-gradient(135deg, ${BRAND.header} 0%, ${BRAND.headerAccent} 100%); padding: 32px 30px; text-align: center;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="text-align: center;">
                  
                  <h1 style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 24px; line-height: 30px; color: #ffffff; font-weight: 800; letter-spacing: -0.5px;">
                    ${BRAND.name}
                  </h1>
                  <p style="margin: 6px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase;">
                    ${BRAND.tagline}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── BODY ── -->
        <tr>
          <td style="padding: 36px 32px 32px; background-color: ${BRAND.card};">
            <div style="font-family: Arial, Helvetica, sans-serif; color: ${BRAND.text};">
              ${bodyContent}
            </div>
          </td>
        </tr>

        <!-- ── DIVIDER ── -->
        <tr>
          <td style="height: 1px; background-color: ${BRAND.border}; padding: 0;"></td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="padding: 24px 32px; background-color: #f8fafc; text-align: center;">
            <p style="margin: 0 0 6px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; color: ${BRAND.muted};">
              You received this alert because you have an active ${BRAND.name} account.
            </p>
            <p style="margin: 0 0 12px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; color: ${BRAND.muted};">
              Need help? Contact us at <a href="mailto:support@cybersense.io" style="color: ${BRAND.accent};">support@cybersense.io</a>
            </p>
            <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 16px; color: #cbd5e1;">
              &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved. &nbsp;|&nbsp;
              <a href="{{PRIVACY_URL}}" style="color: #cbd5e1; text-decoration: underline;">Privacy Policy</a> &nbsp;|&nbsp;
              <a href="{{UNSUBSCRIBE_URL}}" style="color: #cbd5e1; text-decoration: underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>

      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </div>
    <!--[if mso | IE]></td></tr></table><![endif]-->
  </center>
</body>
</html>`;
}

// Reusable CTA button
function ctaButton(url, label, color = BRAND.accent) {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 28px auto 0;">
    <tr>
      <td style="border-radius: 6px; background-color: ${color};">
        <a href="${escapeAttribute(normalizeUrl(url))}" target="_blank"
           style="display: block; background-color: ${color}; border-radius: 6px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; font-weight: 700; line-height: 1; padding: 14px 28px; color: #ffffff; text-decoration: none; text-align: center; min-width: 160px;">
          ${escapeHtml(label)} &rarr;
        </a>
      </td>
    </tr>
  </table>`;
}

// Reusable info row for detail tables
function detailRow(label, value, isLast = false) {
  return `
  <tr>
    <td style="padding: 11px 16px; border-bottom: ${isLast ? "none" : `1px solid ${BRAND.border}`}; width: 38%; background-color: #f8fafc; vertical-align: top;">
      <span style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; color: ${BRAND.textSecondary}; text-transform: uppercase; letter-spacing: 0.5px;">${label}</span>
    </td>
    <td style="padding: 11px 16px; border-bottom: ${isLast ? "none" : `1px solid ${BRAND.border}`}; vertical-align: top;">
      <span style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: ${BRAND.text}; word-break: break-all;">${value}</span>
    </td>
  </tr>`;
}

// Alert banner at top of email body
function alertBanner(message, type = "danger") {
  const styles = {
    danger:  { bg: BRAND.dangerBg,  border: BRAND.danger,  color: BRAND.danger,  icon: "" },
    warning: { bg: BRAND.warningBg, border: BRAND.warning, color: BRAND.warning, icon: "" },
    success: { bg: BRAND.successBg, border: BRAND.success, color: BRAND.success, icon: "" },
    info:    { bg: BRAND.infoBg,    border: BRAND.info,    color: BRAND.info,    icon: "" },
  };
  const s = styles[type] || styles.info;
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; border-radius: 6px; overflow: hidden;">
    <tr>
      <td style="background-color: ${s.bg}; border-left: 4px solid ${s.border}; border-radius: 0 6px 6px 0; padding: 14px 16px;">
        <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: 700; color: ${s.color};">
          ${escapeHtml(message)}
        </p>
      </td>
    </tr>
  </table>`;
}

// Signal tag for detected threat indicators
function signalTag(label, severity = "danger") {
  const colors = {
    danger:  { bg: "#fef2f2", border: "#fecaca", color: BRAND.danger },
    warning: { bg: "#fffbeb", border: "#fde68a", color: BRAND.warning },
    info:    { bg: "#f0f9ff", border: "#bae6fd", color: BRAND.info },
  };
  const c = colors[severity] || colors.danger;
  return `<span style="display: inline-block; margin: 3px 4px 3px 0; padding: 3px 10px; background-color: ${c.bg}; border: 1px solid ${c.border}; border-radius: 12px; font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; color: ${c.color}; letter-spacing: 0.3px;">${escapeHtml(label)}</span>`;
}

// ─── TEMPLATES ────────────────────────────────────────────────────────────────
const emailTemplates = {

  // ── 1. PHISHING ALERT (Completely rebuilt) ──────────────────────────────────
  phishingAlert({
    userName,
    target,
    riskScore,
    classification,
    scanId,
    scanType = "url",
    scannedAt,
    detectedSignals = [],      // e.g. ["Typosquatting", "Blacklisted Domain", "No SSL"]
    threatFeeds = [],          // e.g. [{name:"Google Safe Browsing", verdict:"malicious"}]
    domainAge = null,          // e.g. "2 days"
    recommendations = [],      // custom action steps (optional)
    frontendUrl,
  }) {
    const safeName = escapeHtml(userName);
    const safeTarget = escapeHtml(target);
    const score = Number(riskScore) || 0;
    const scoreStyle = getScoreStyle(score);
    const classStyle = getClassificationStyle(classification);
    const formattedClass = formatClassification(classification);
    const scanTypeLabel = { url: "URL", email: "Email", sms: "SMS" }[scanType] || scanType.toUpperCase();
    const scanTime = formatDate(scannedAt);

    const isPhishing = classification.toLowerCase() === "phishing";
    const isSuspicious = classification.toLowerCase() === "suspicious";

    const subject = isPhishing
      ? `Phishing Detected — Risk Score ${score}/100`
      : isSuspicious
      ? `Suspicious Content Flagged — Risk Score ${score}/100`
      : `Scan Complete — Content Appears Safe`;

    // Default recommendations based on classification
    const defaultRecs = isPhishing ? [
      "Do NOT click any links in this content",
      "Do NOT enter any personal or financial information",
      "Mark the email as phishing in your email client if applicable",
      "Report it to your IT or security team",
      "Delete the message immediately",
    ] : isSuspicious ? [
      "Exercise extreme caution before interacting",
      "Verify the sender's identity through an official channel",
      "Do not provide personal or login credentials",
      "Contact support if you are unsure",
    ] : [
      "Content appears safe based on current threat data",
      "Always stay vigilant — threat intelligence updates continuously",
    ];

    const finalRecs = recommendations.length > 0 ? recommendations : defaultRecs;

    // Build signals section
    const signalsSection = detectedSignals.length > 0 ? `
      <p style="margin: 0 0 10px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color: ${BRAND.textSecondary}; text-transform: uppercase; letter-spacing: 0.5px;">Detection Signals</p>
      <div style="margin-bottom: 24px;">
        ${detectedSignals.map(s => signalTag(s, isPhishing ? "danger" : "warning")).join("")}
      </div>` : "";

    // Build threat feeds section
    const feedsSection = threatFeeds.length > 0 ? `
      <p style="margin: 0 0 10px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color: ${BRAND.textSecondary}; text-transform: uppercase; letter-spacing: 0.5px;">Threat Intelligence Sources</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; border: 1px solid ${BRAND.border}; border-radius: 6px; overflow: hidden;">
        ${threatFeeds.map((feed, i) => {
          const isLast = i === threatFeeds.length - 1;
          const verdictColor = feed.verdict === "malicious" ? BRAND.danger : feed.verdict === "suspicious" ? BRAND.warning : BRAND.success;
          const verdictLabel = feed.verdict === "malicious" ? "MALICIOUS" : feed.verdict === "suspicious" ? "SUSPICIOUS" : "CLEAN";
          return `<tr>
            <td style="padding: 10px 16px; border-bottom: ${isLast ? "none" : `1px solid ${BRAND.border}`}; background-color: #f8fafc; width: 50%;">
              <span style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 600; color: ${BRAND.text};">${escapeHtml(feed.name)}</span>
            </td>
            <td style="padding: 10px 16px; border-bottom: ${isLast ? "none" : `1px solid ${BRAND.border}`};">
              <span style="display: inline-block; padding: 2px 10px; border-radius: 10px; background-color: ${verdictColor}; font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">${verdictLabel}</span>
            </td>
          </tr>`;
        }).join("")}
      </table>` : "";

    // Recommendations list
    const recsSection = `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 28px; background-color: ${isPhishing ? BRAND.dangerBg : BRAND.warningBg}; border: 1px solid ${isPhishing ? BRAND.dangerBorder : BRAND.warningBorder}; border-radius: 6px;">
        <tr>
          <td style="padding: 16px 20px;">
            <p style="margin: 0 0 10px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color: ${isPhishing ? BRAND.danger : BRAND.warning}; text-transform: uppercase; letter-spacing: 0.5px;">
              ${isPhishing ? "What You Should Do Right Now" : "Recommended Actions"}
            </p>
            ${finalRecs.map(rec => `
              <p style="margin: 0 0 6px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 20px; color: ${BRAND.text};">
                &bull;&nbsp; ${escapeHtml(rec)}
              </p>`).join("")}
          </td>
        </tr>
      </table>`;

    const html = layout(`
      <h2 style="margin: 0 0 6px; font-family: Arial, Helvetica, sans-serif; font-size: 20px; font-weight: 700; color: ${BRAND.text};">Hi ${safeName},</h2>
      <p style="margin: 0 0 24px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: ${BRAND.textSecondary};">Your recent ${scanTypeLabel} scan has been completed. Here are the results.</p>

      ${alertBanner(
        isPhishing ? `High-risk phishing threat detected — Risk Score ${score}/100` :
        isSuspicious ? `Suspicious content flagged — Risk Score ${score}/100` :
        "Content scanned — no significant threats detected",
        isPhishing ? "danger" : isSuspicious ? "warning" : "success"
      )}

      <!-- Score + Classification hero row -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="width: 50%; padding: 0 8px 0 0; vertical-align: top;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid ${BRAND.border}; border-radius: 6px; overflow: hidden;">
              <tr><td style="padding: 16px; text-align: center; background-color: #f8fafc; border-bottom: 1px solid ${BRAND.border};">
                <span style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 1px;">Risk Score</span>
              </td></tr>
              <tr><td style="padding: 20px; text-align: center;">
                <div style="display: inline-block; background-color: ${scoreStyle.bg}; border-radius: 50%; width: 70px; height: 70px; line-height: 70px; font-family: Arial, Helvetica, sans-serif; font-size: 22px; font-weight: 900; color: ${scoreStyle.color};">${score}</div>
                <p style="margin: 8px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; color: ${scoreStyle.bg}; letter-spacing: 1px;">${scoreStyle.label}</p>
              </td></tr>
            </table>
          </td>
          <td style="width: 50%; padding: 0 0 0 8px; vertical-align: top;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid ${BRAND.border}; border-radius: 6px; overflow: hidden;">
              <tr><td style="padding: 16px; text-align: center; background-color: #f8fafc; border-bottom: 1px solid ${BRAND.border};">
                <span style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: 700; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 1px;">Classification</span>
              </td></tr>
              <tr><td style="padding: 20px; text-align: center;">
                <div style="display: inline-block; background-color: ${classStyle.bg}; border: 2px solid ${classStyle.border}; border-radius: 6px; padding: 8px 16px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 900; color: ${classStyle.color}; letter-spacing: 1px;">${formattedClass}</div>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Scan Details Table -->
      <p style="margin: 0 0 10px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color: ${BRAND.textSecondary}; text-transform: uppercase; letter-spacing: 0.5px;">Scan Details</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; border: 1px solid ${BRAND.border}; border-radius: 6px; overflow: hidden;">
        ${detailRow("Scan Type", scanTypeLabel)}
        ${detailRow("Target", `<span style="font-family:'Courier New',Courier,monospace;font-size:12px;color:${isPhishing ? BRAND.danger : BRAND.text};">${safeTarget}</span>`)}
        ${domainAge ? detailRow("Domain Age", `<span style="color:${BRAND.danger};font-weight:700;">${escapeHtml(domainAge)}</span> — Recently registered domains are high-risk`) : ""}
        ${detailRow("Scan ID", `<span style="font-family:'Courier New',Courier,monospace;font-size:11px;color:${BRAND.muted};">${escapeHtml(scanId)}</span>`)}
        ${detailRow("Scanned At", escapeHtml(scanTime), true)}
      </table>

      ${signalsSection}
      ${feedsSection}
      ${recsSection}

      ${ctaButton(`${frontendUrl}/scan/${scanId}`, "View Full Scan Report", isPhishing ? BRAND.danger : BRAND.accent)}

      <p style="margin: 24px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px; color: ${BRAND.muted}; text-align: center;">
        This alert was generated automatically by the ${BRAND.name} detection engine.
      </p>
    `, `${formattedClass} detected — Risk Score ${score}/100 for scanned ${scanTypeLabel}`);

    const text = [
      `Hi ${userName},`,
      "",
      `CYBERSENSE SECURITY ALERT`,
      `Classification: ${formattedClass} | Risk Score: ${score}/100`,
      "─".repeat(50),
      "",
      `Scan Type: ${scanTypeLabel}`,
      `Target: ${target}`,
      domainAge ? `Domain Age: ${domainAge}` : "",
      `Scan ID: ${scanId}`,
      `Scanned At: ${scanTime}`,
      "",
      detectedSignals.length > 0 ? `Detection Signals: ${detectedSignals.join(", ")}` : "",
      "",
      threatFeeds.length > 0 ? "Threat Intelligence:\n" + threatFeeds.map(f => `  • ${f.name}: ${f.verdict.toUpperCase()}`).join("\n") : "",
      "",
      "RECOMMENDED ACTIONS:",
      ...finalRecs.map(r => `  • ${r}`),
      "",
      `View full report: ${normalizeUrl(`${frontendUrl}/scan/${scanId}`)}`,
    ].filter(Boolean).join("\n");

    return { subject, html, text };
  },

  // ── 2. EMAIL VERIFICATION ───────────────────────────────────────────────────
  emailVerification({ verifyUrl, userName }) {
    const safeName = escapeHtml(userName);
    const subject = `Verify your ${BRAND.name} account`;

    const html = layout(`
      <h2 style="margin: 0 0 8px; font-family: Arial, Helvetica, sans-serif; font-size: 22px; font-weight: 700; color: ${BRAND.text};">Welcome to ${BRAND.name}, ${safeName}.</h2>
      <p style="margin: 0 0 24px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 24px; color: ${BRAND.textSecondary};">
        You are one step away from protecting yourself from phishing threats. Verify your email address to activate your account and start scanning.
      </p>
      ${ctaButton(verifyUrl, "Verify Email Address")}
      <p style="margin: 20px 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 20px; color: ${BRAND.muted}; text-align: center;">
        This link expires in <strong>24 hours</strong>. If you did not create a ${BRAND.name} account, ignore this email.
      </p>
    `, `Verify your email to activate your ${BRAND.name} account`);

    const text = [
      `Welcome to ${BRAND.name}, ${userName}.`,
      "",
      "Verify your email to activate your account:",
      normalizeUrl(verifyUrl),
      "",
      "Link expires in 24 hours.",
      "If you did not create this account, ignore this email.",
    ].join("\n");

    return { subject, html, text };
  },

  // ── 3. PASSWORD RESET ───────────────────────────────────────────────────────
  passwordReset({ resetUrl, userName }) {
    const safeName = escapeHtml(userName);
    const subject = `Reset your ${BRAND.name} password`;

    const html = layout(`
      <h2 style="margin: 0 0 8px; font-family: Arial, Helvetica, sans-serif; font-size: 22px; font-weight: 700; color: ${BRAND.text};">Password Reset Request</h2>
      <p style="margin: 0 0 6px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: ${BRAND.textSecondary};">Hi ${safeName},</p>
      <p style="margin: 0 0 24px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 24px; color: ${BRAND.textSecondary};">
        We received a request to reset the password on your ${BRAND.name} account. Click the button below to choose a new password.
      </p>
      ${ctaButton(resetUrl, "Reset My Password")}
      <p style="margin: 20px 0 16px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 20px; color: ${BRAND.muted}; text-align: center;">
        This link expires in <strong>1 hour</strong>.
      </p>
      ${alertBanner("If you did not request a password reset, your account may be at risk. Change your password immediately and contact support.", "warning")}
    `, "Reset your CyberSense password — link expires in 1 hour");

    const text = [
      `Hi ${userName},`,
      "",
      "We received a request to reset your CyberSense password.",
      "",
      `Reset your password: ${normalizeUrl(resetUrl)}`,
      "",
      "This link expires in 1 hour.",
      "If you did not request this, change your password immediately and contact support.",
    ].join("\n");

    return { subject, html, text };
  },

  // ── 4. PASSWORD CHANGED ─────────────────────────────────────────────────────
  passwordChanged({ userName }) {
    const safeName = escapeHtml(userName);
    const subject = `Security Alert: Your ${BRAND.name} password was changed`;

    const html = layout(`
      <h2 style="margin: 0 0 8px; font-family: Arial, Helvetica, sans-serif; font-size: 22px; font-weight: 700; color: ${BRAND.text};">Password Changed</h2>
      <p style="margin: 0 0 6px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: ${BRAND.textSecondary};">Hi ${safeName},</p>
      <p style="margin: 0 0 24px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 24px; color: ${BRAND.textSecondary};">
        Your ${BRAND.name} account password was successfully changed on ${formatDate(new Date())}.
      </p>
      ${alertBanner("Did not make this change? Contact support immediately — your account may be compromised.", "danger")}
    `, "Your CyberSense password has been changed");

    const text = [
      `Hi ${userName},`,
      "",
      `Your CyberSense password was changed on ${formatDate(new Date())}.`,
      "",
      "If you did not make this change, contact support immediately.",
    ].join("\n");

    return { subject, html, text };
  },

  // ── 5. REPORT STATUS UPDATE ─────────────────────────────────────────────────
  reportStatusUpdate({ userName, reportId, newStatus, notes, frontendUrl }) {
    const safeName = escapeHtml(userName);
    const safeNotes = notes ? escapeHtml(notes) : null;

    const statusMap = {
      pending:        { label: "Pending Review",    color: BRAND.warning, bg: BRAND.warningBg, msg: "Your report has been received and is queued for analyst review." },
      under_review:   { label: "Under Review",      color: BRAND.info,    bg: BRAND.infoBg,    msg: "A security analyst is actively reviewing your submission." },
      confirmed:      { label: "Confirmed Phishing",color: BRAND.danger,  bg: BRAND.dangerBg,  icon: "", msg: "Your report has been confirmed as a phishing threat. The domain has been added to our blocklist. Thank you for protecting our community." },
      false_positive: { label: "Safe — No Threat",  color: BRAND.success, bg: BRAND.successBg, icon: "", msg: "Our analysts reviewed your submission and determined the content is safe. No action is needed." },
    };

    const statusInfo = statusMap[newStatus] || { label: newStatus, color: BRAND.accent, bg: BRAND.infoBg, msg: "Your report status has been updated." };
    const subject = `Report Update: ${statusInfo.label} — ${reportId.slice(0, 8).toUpperCase()}`;

    const html = layout(`
      <h2 style="margin: 0 0 8px; font-family: Arial, Helvetica, sans-serif; font-size: 22px; font-weight: 700; color: ${BRAND.text};">Report Status Update</h2>
      <p style="margin: 0 0 24px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: ${BRAND.textSecondary};">Hi ${safeName},</p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; background-color: ${statusInfo.bg}; border: 1px solid ${statusInfo.color}33; border-radius: 6px;">
        <tr>
          <td style="padding: 20px; text-align: center;">
            
            <div style="display: inline-block; padding: 6px 18px; background-color: ${statusInfo.color}; border-radius: 20px; font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; margin-bottom: 12px;">${statusInfo.label.toUpperCase()}</div>
            <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px; color: ${BRAND.text};">${statusInfo.msg}</p>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; border: 1px solid ${BRAND.border}; border-radius: 6px; overflow: hidden;">
        ${detailRow("Report ID", `<span style="font-family:'Courier New',Courier,monospace;font-size:12px;">${escapeHtml(reportId)}</span>`)}
        ${detailRow("Updated At", escapeHtml(formatDate(new Date())), !safeNotes)}
        ${safeNotes ? detailRow("Analyst Notes", safeNotes, true) : ""}
      </table>

      ${ctaButton(`${frontendUrl}/reports/${reportId}`, "View Report")}
    `, `Report ${reportId.slice(0, 8).toUpperCase()} — Status: ${statusInfo.label}`);

    const text = [
      `Hi ${userName},`,
      "",
      `Your report status has been updated to: ${statusInfo.label}`,
      "",
      statusInfo.msg,
      "",
      `Report ID: ${reportId}`,
      notes ? `Analyst Notes: ${notes}` : "",
      "",
      `View report: ${normalizeUrl(`${frontendUrl}/reports/${reportId}`)}`,
    ].filter(Boolean).join("\n");

    return { subject, html, text };
  },

  // ── 6. REPORT RECEIVED CONFIRMATION ────────────────────────────────────────
  reportReceived({ userName, reportId, reportType, frontendUrl }) {
    const safeName = escapeHtml(userName);
    const safeType = escapeHtml(reportType);
    const subject = `We received your ${reportType} report — Thank you`;

    const html = layout(`
      <h2 style="margin: 0 0 8px; font-family: Arial, Helvetica, sans-serif; font-size: 22px; font-weight: 700; color: ${BRAND.text};">Report Received</h2>
      <p style="margin: 0 0 24px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: ${BRAND.textSecondary};">Hi ${safeName},</p>
      ${alertBanner(`Thank you for reporting a suspicious ${safeType}. Your submission helps protect every CyberSense user.`, "success")}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; border: 1px solid ${BRAND.border}; border-radius: 6px; overflow: hidden;">
        ${detailRow("Report Type", safeType.toUpperCase())}
        ${detailRow("Report ID", `<span style="font-family:'Courier New',Courier,monospace;font-size:12px;">${escapeHtml(reportId)}</span>`)}
        ${detailRow("Submitted At", escapeHtml(formatDate(new Date())), true)}
      </table>
      <p style="margin: 0 0 20px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px; color: ${BRAND.textSecondary};">
        Our automated detection engine and security analysts will review your submission. You will receive an email when the status changes.
      </p>
      ${ctaButton(`${frontendUrl}/reports/${reportId}`, "Track Report Status")}
    `, `Report received — we'll review your ${reportType} submission shortly`);

    const text = [
      `Hi ${userName},`,
      "",
      `Thank you for reporting a suspicious ${reportType}.`,
      "",
      `Report ID: ${reportId}`,
      `Submitted At: ${formatDate(new Date())}`,
      "",
      "You will receive an email when the status changes.",
      "",
      `Track status: ${normalizeUrl(`${frontendUrl}/reports/${reportId}`)}`,
    ].join("\n");

    return { subject, html, text };
  },

  // ── 7. NEW REPORT ALERT (for admins/analysts) ───────────────────────────────
  newReportAlert({ adminName, reportId, reporterEmail, reportType, riskScore, classification, frontendUrl }) {
    const safeName = escapeHtml(adminName);
    const score = Number(riskScore) || 0;
    const scoreStyle = getScoreStyle(score);
    const subject = `Action Required: New ${reportType.toUpperCase()} Report Needs Review`;

    const html = layout(`
      <h2 style="margin: 0 0 8px; font-family: Arial, Helvetica, sans-serif; font-size: 22px; font-weight: 700; color: ${BRAND.text};">New Report Requires Review</h2>
      <p style="margin: 0 0 24px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: ${BRAND.textSecondary};">Hi ${safeName},</p>
      ${alertBanner(`A new ${reportType} report has been submitted and is awaiting analyst review.`, score >= 75 ? "danger" : "warning")}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; border: 1px solid ${BRAND.border}; border-radius: 6px; overflow: hidden;">
        ${detailRow("Report Type", reportType.toUpperCase())}
        ${detailRow("Submitted By", escapeHtml(reporterEmail))}
        ${detailRow("Report ID", `<span style="font-family:'Courier New',Courier,monospace;font-size:12px;">${escapeHtml(reportId)}</span>`)}
        ${detailRow("Risk Score", `<span style="display:inline-block;padding:3px 12px;border-radius:12px;background-color:${scoreStyle.bg};color:${scoreStyle.color};font-weight:700;font-size:13px;">${score}/100 — ${scoreStyle.label}</span>`)}
        ${detailRow("Initial Classification", formatClassification(classification), true)}
      </table>
      ${ctaButton(`${frontendUrl}/admin/reports/${reportId}`, "Review Report", BRAND.accentDark)}
    `, `New ${reportType} report — Risk Score ${score}/100 awaiting review`);

    const text = [
      `Hi ${adminName},`,
      "",
      `A new ${reportType} report requires review.`,
      "",
      `Submitted By: ${reporterEmail}`,
      `Report ID: ${reportId}`,
      `Risk Score: ${score}/100`,
      `Classification: ${formatClassification(classification)}`,
      "",
      `Review: ${normalizeUrl(`${frontendUrl}/admin/reports/${reportId}`)}`,
    ].join("\n");

    return { subject, html, text };
  },

  // ── 8. MFA ENABLED ──────────────────────────────────────────────────────────
  mfaEnabled({ userName }) {
    const safeName = escapeHtml(userName);
    const subject = `Security Update: Two-Factor Authentication Enabled`;

    const html = layout(`
      <h2 style="margin: 0 0 8px; font-family: Arial, Helvetica, sans-serif; font-size: 22px; font-weight: 700; color: ${BRAND.text};">Two-Factor Authentication Enabled</h2>
      <p style="margin: 0 0 24px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: ${BRAND.textSecondary};">Hi ${safeName},</p>
      ${alertBanner("Two-Factor Authentication (2FA) has been successfully enabled on your account. Your account is now significantly more secure.", "success")}
      <p style="margin: 0 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px; color: ${BRAND.textSecondary};">
        From now on you will need your authenticator app each time you sign in. Keep your backup codes in a safe place.
      </p>
    `, "2FA enabled on your CyberSense account");

    const text = [`Hi ${userName},`, "", "Two-Factor Authentication has been enabled on your CyberSense account.", "Your account is now more secure.", "", "If you did not make this change, contact support immediately."].join("\n");
    return { subject, html, text };
  },

  // ── 9. MFA DISABLED ─────────────────────────────────────────────────────────
  mfaDisabled({ userName }) {
    const safeName = escapeHtml(userName);
    const subject = `Security Alert: Two-Factor Authentication Disabled`;

    const html = layout(`
      <h2 style="margin: 0 0 8px; font-family: Arial, Helvetica, sans-serif; font-size: 22px; font-weight: 700; color: ${BRAND.text};">Two-Factor Authentication Disabled</h2>
      <p style="margin: 0 0 24px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: ${BRAND.textSecondary};">Hi ${safeName},</p>
      ${alertBanner("Two-Factor Authentication has been DISABLED on your account. Your account is now less secure. If you did not do this, contact support immediately — your account may be compromised.", "danger")}
    `, "ALERT: 2FA disabled on your CyberSense account");

    const text = [`Hi ${userName},`, "", "Two-Factor Authentication has been DISABLED on your CyberSense account.", "", "If you did not make this change, your account may be compromised. Contact support immediately."].join("\n");
    return { subject, html, text };
  },

};

module.exports = emailTemplates;
