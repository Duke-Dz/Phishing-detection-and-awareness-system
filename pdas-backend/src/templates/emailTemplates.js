// src/templates/emailTemplates.js
// Premium email templates for CyberSense
// No emojis — uses pure HTML/CSS visual elements for a professional enterprise look

const BRAND = {
  name: "CyberSense",
  tagline: "Phishing Detection & Awareness Platform",
  // Header
  headerDark: "#06080f",
  headerMid: "#0c1124",
  headerLight: "#141d38",
  // Accent
  accent: "#4f8cff",
  accentDark: "#2563eb",
  accentGlow: "rgba(79,140,255,0.15)",
  // Semantic
  danger: "#ef4444",
  dangerDark: "#b91c1c",
  dangerBg: "#fef2f2",
  dangerBgDeep: "#fee2e2",
  dangerBorder: "#fca5a5",
  warning: "#f59e0b",
  warningDark: "#b45309",
  warningBg: "#fffbeb",
  warningBgDeep: "#fef3c7",
  warningBorder: "#fcd34d",
  success: "#22c55e",
  successDark: "#15803d",
  successBg: "#f0fdf4",
  successBgDeep: "#dcfce7",
  successBorder: "#86efac",
  info: "#0ea5e9",
  infoDark: "#0369a1",
  infoBg: "#f0f9ff",
  infoBorder: "#7dd3fc",
  // Layout
  pageBg: "#eef1f8",
  card: "#ffffff",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  rowAlt: "#f8fafc",
  // Typography
  text: "#0f172a",
  textSecondary: "#475569",
  muted: "#94a3b8",
  faint: "#cbd5e1",
  // Font stack
  font: "'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, Helvetica, sans-serif",
  mono: "'Courier New', Courier, monospace",
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
  const map = { phishing: "PHISHING", suspicious: "SUSPICIOUS", safe: "SAFE" };
  return map[classification.toLowerCase()] || classification.toUpperCase();
};

// ─── Score Styling ─────────────────────────────────────────────
const getScoreStyle = (score) => {
  if (score >= 75) return { bg: BRAND.danger, bgLight: BRAND.dangerBg, track: BRAND.dangerBgDeep, color: "#ffffff", label: "HIGH RISK", textColor: BRAND.dangerDark };
  if (score >= 50) return { bg: BRAND.warning, bgLight: BRAND.warningBg, track: BRAND.warningBgDeep, color: "#ffffff", label: "MEDIUM RISK", textColor: BRAND.warningDark };
  if (score >= 25) return { bg: "#eab308", bgLight: "#fefce8", track: "#fef9c3", color: "#ffffff", label: "LOW RISK", textColor: "#a16207" };
  return { bg: BRAND.success, bgLight: BRAND.successBg, track: BRAND.successBgDeep, color: "#ffffff", label: "SAFE", textColor: BRAND.successDark };
};

const getClassificationStyle = (classification = "") => {
  const map = {
    phishing:   { bg: BRAND.dangerBg,  border: BRAND.danger,  color: BRAND.dangerDark },
    suspicious: { bg: BRAND.warningBg, border: BRAND.warning, color: BRAND.warningDark },
    safe:       { bg: BRAND.successBg, border: BRAND.success, color: BRAND.successDark },
  };
  return map[classification.toLowerCase()] || map.suspicious;
};

// ─── Threat color for the entire email accent ──────────────────
const getThreatAccent = (classification = "") => {
  const map = {
    phishing: BRAND.danger,
    suspicious: BRAND.warning,
    safe: BRAND.success,
  };
  return map[classification.toLowerCase()] || BRAND.accent;
};


// ═══════════════════════════════════════════════════════════════
//  SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════

/**
 * Master layout wrapper.
 * @param {string} bodyContent  – inner HTML
 * @param {string} preheaderText – hidden preview text
 * @param {string} accentColor  – top accent bar color (contextual)
 */
function layout(bodyContent, preheaderText = "", accentColor = BRAND.accent) {
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
  <style>body,table,td{font-family:Arial,Helvetica,sans-serif!important;}</style>
  <![endif]-->
  <style>
    html, body { margin: 0 !important; padding: 0 !important; height: 100% !important; width: 100% !important; }
    * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; box-sizing: border-box; }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
    table { border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    a { text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; margin: 0 !important; }
      .mob-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .mob-full { width: 100% !important; display: block !important; }
      .mob-hide { display: none !important; }
      .mob-center { text-align: center !important; }
    }
  </style>
</head>
<body width="100%" style="margin: 0; padding: 0 !important; background-color: ${BRAND.pageBg}; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  ${preheaderText ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheaderText)}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ""}
  <center style="width: 100%; background-color: ${BRAND.pageBg};">
    <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BRAND.pageBg};"><tr><td><![endif]-->
    <div style="max-width: 620px; margin: 0 auto; padding: 40px 16px;" class="email-container">
      <!--[if mso]><table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="620"><tr><td><![endif]-->

      <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto; background-color: ${BRAND.card}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 8px 30px rgba(0,0,0,0.06);">

        <!-- ━━ TOP ACCENT BAR ━━ -->
        <tr><td style="height: 5px; background: linear-gradient(90deg, ${accentColor} 0%, ${BRAND.accent} 100%); font-size: 0; line-height: 0;">&nbsp;</td></tr>

        <!-- ━━ HEADER ━━ -->
        <tr>
          <td style="background: linear-gradient(160deg, ${BRAND.headerDark} 0%, ${BRAND.headerMid} 55%, ${BRAND.headerLight} 100%); padding: 0;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="padding: 40px 44px 36px;" class="mob-pad">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <!-- Shield mark — pure HTML/CSS -->
                      <td style="width: 48px; vertical-align: middle; padding-right: 16px;">
                        <div style="width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, ${BRAND.accent} 0%, ${BRAND.accentDark} 100%); text-align: center; line-height: 44px;">
                          <span style="font-family: ${BRAND.font}; font-size: 20px; font-weight: 900; color: #ffffff; letter-spacing: -1px;">CS</span>
                        </div>
                      </td>
                      <td style="vertical-align: middle;">
                        <p style="margin: 0; font-family: ${BRAND.font}; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; line-height: 1.2;">
                          ${BRAND.name}
                        </p>
                        <p style="margin: 4px 0 0; font-family: ${BRAND.font}; font-size: 11px; color: #64748b; letter-spacing: 2.5px; text-transform: uppercase; font-weight: 600; line-height: 1;">
                          ${BRAND.tagline}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ━━ BODY ━━ -->
        <tr>
          <td style="padding: 44px 44px 40px; background-color: ${BRAND.card};" class="mob-pad">
            <div style="font-family: ${BRAND.font}; color: ${BRAND.text};">
              ${bodyContent}
            </div>
          </td>
        </tr>

        <!-- ━━ FOOTER ━━ -->
        <tr>
          <td style="border-top: 1px solid ${BRAND.border}; padding: 32px 44px 36px; background-color: ${BRAND.rowAlt};" class="mob-pad">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="text-align: center;">
                  <!-- Brand -->
                  <p style="margin: 0 0 4px; font-family: ${BRAND.font}; font-size: 14px; font-weight: 800; color: ${BRAND.text}; letter-spacing: -0.3px;">${BRAND.name}</p>
                  <p style="margin: 0 0 16px; font-family: ${BRAND.font}; font-size: 11px; color: ${BRAND.muted}; letter-spacing: 1px; text-transform: uppercase;">${BRAND.tagline}</p>
                  <!-- Info -->
                  <p style="margin: 0 0 6px; font-family: ${BRAND.font}; font-size: 12px; line-height: 20px; color: ${BRAND.muted};">
                    You received this because you have an active ${BRAND.name} account.
                  </p>
                  <p style="margin: 0 0 20px; font-family: ${BRAND.font}; font-size: 12px; line-height: 20px; color: ${BRAND.muted};">
                    Questions? <a href="mailto:support@cybersense.io" style="color: ${BRAND.accent}; font-weight: 600; text-decoration: none;">support@cybersense.io</a>
                  </p>
                  <!-- Links -->
                  <p style="margin: 0; font-family: ${BRAND.font}; font-size: 11px; color: ${BRAND.faint};">
                    <a href="{{PRIVACY_URL}}" style="color: ${BRAND.muted}; text-decoration: underline;">Privacy Policy</a>
                    &nbsp;&nbsp;&#183;&nbsp;&nbsp;
                    <a href="{{UNSUBSCRIBE_URL}}" style="color: ${BRAND.muted}; text-decoration: underline;">Unsubscribe</a>
                    &nbsp;&nbsp;&#183;&nbsp;&nbsp;
                    &copy; ${new Date().getFullYear()} ${BRAND.name}
                  </p>
                </td>
              </tr>
            </table>
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


// ─── CTA Button (with VML fallback for Outlook) ───────────────
function ctaButton(url, label, color = BRAND.accent) {
  const safeUrl = escapeAttribute(normalizeUrl(url));
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 36px auto 0;">
    <tr>
      <td align="center" style="border-radius: 8px; background-color: ${color};">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeUrl}" style="height:50px;v-text-anchor:middle;width:240px;" arcsize="16%" fillcolor="${color}" stroke="f">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;">${escapeHtml(label)} &#8594;</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${safeUrl}" target="_blank"
           style="display: inline-block; background-color: ${color}; border-radius: 8px; font-family: ${BRAND.font}; font-size: 15px; font-weight: 700; line-height: 50px; height: 50px; padding: 0 36px; color: #ffffff; text-decoration: none; text-align: center; min-width: 180px; letter-spacing: 0.2px;">
          ${escapeHtml(label)} &#8594;
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>`;
}


// ─── Section Divider ───────────────────────────────────────────
function sectionLabel(label) {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0 14px;">
    <tr>
      <td style="vertical-align: middle; padding-right: 14px; white-space: nowrap;">
        <span style="font-family: ${BRAND.font}; font-size: 11px; font-weight: 800; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 2px;">${label}</span>
      </td>
      <td style="vertical-align: middle; width: 100%;">
        <div style="height: 1px; background-color: ${BRAND.border};"></div>
      </td>
    </tr>
  </table>`;
}


// ─── Detail Row ────────────────────────────────────────────────
function detailRow(label, value, isLast = false) {
  return `
  <tr>
    <td style="padding: 14px 20px; border-bottom: ${isLast ? "none" : `1px solid ${BRAND.borderLight}`}; width: 35%; background-color: ${BRAND.rowAlt}; vertical-align: top;">
      <span style="font-family: ${BRAND.font}; font-size: 11px; font-weight: 700; color: ${BRAND.muted}; text-transform: uppercase; letter-spacing: 0.8px;">${label}</span>
    </td>
    <td style="padding: 14px 20px; border-bottom: ${isLast ? "none" : `1px solid ${BRAND.borderLight}`}; vertical-align: top;">
      <span style="font-family: ${BRAND.font}; font-size: 13px; color: ${BRAND.text}; word-break: break-all; line-height: 1.5;">${value}</span>
    </td>
  </tr>`;
}


// ─── Alert Banner ──────────────────────────────────────────────
function alertBanner(message, type = "danger") {
  const styles = {
    danger:  { bg: BRAND.dangerBg,  accent: BRAND.danger,  color: BRAND.dangerDark },
    warning: { bg: BRAND.warningBg, accent: BRAND.warning, color: BRAND.warningDark },
    success: { bg: BRAND.successBg, accent: BRAND.success, color: BRAND.successDark },
    info:    { bg: BRAND.infoBg,    accent: BRAND.info,    color: BRAND.infoDark },
  };
  const s = styles[type] || styles.info;
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
    <tr>
      <!-- Colored side bar -->
      <td style="width: 5px; background-color: ${s.accent}; border-radius: 4px 0 0 4px;"></td>
      <td style="background-color: ${s.bg}; padding: 18px 22px; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; font-family: ${BRAND.font}; font-size: 14px; font-weight: 600; line-height: 23px; color: ${s.color};">
          ${escapeHtml(message)}
        </p>
      </td>
    </tr>
  </table>`;
}


// ─── Signal Tag ────────────────────────────────────────────────
function signalTag(label, severity = "danger") {
  const colors = {
    danger:  { bg: BRAND.dangerBg,  border: BRAND.dangerBorder,  color: BRAND.dangerDark },
    warning: { bg: BRAND.warningBg, border: BRAND.warningBorder, color: BRAND.warningDark },
    info:    { bg: BRAND.infoBg,    border: BRAND.infoBorder,    color: BRAND.infoDark },
  };
  const c = colors[severity] || colors.danger;
  return `<span style="display: inline-block; margin: 3px 6px 3px 0; padding: 5px 14px; background-color: ${c.bg}; border: 1px solid ${c.border}; border-radius: 4px; font-family: ${BRAND.font}; font-size: 11px; font-weight: 700; color: ${c.color}; letter-spacing: 0.3px;">${escapeHtml(label)}</span>`;
}


// ─── Risk Meter Bar ────────────────────────────────────────────
function riskMeter(score, scoreStyle) {
  const pct = Math.min(100, Math.max(0, score));
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0;">
    <tr>
      <td>
        <!-- Score number -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td>
              <span style="font-family: ${BRAND.font}; font-size: 42px; font-weight: 900; color: ${scoreStyle.bg}; letter-spacing: -2px; line-height: 1;">${score}</span>
              <span style="font-family: ${BRAND.font}; font-size: 16px; font-weight: 600; color: ${BRAND.muted}; vertical-align: top; position: relative; top: 6px;">/100</span>
            </td>
            <td style="text-align: right; vertical-align: bottom; padding-bottom: 6px;">
              <span style="display: inline-block; padding: 4px 14px; background-color: ${scoreStyle.bgLight}; border-radius: 4px; font-family: ${BRAND.font}; font-size: 11px; font-weight: 800; color: ${scoreStyle.textColor}; letter-spacing: 1px;">${scoreStyle.label}</span>
            </td>
          </tr>
        </table>
        <!-- Meter track -->
        <div style="margin-top: 12px; background-color: ${scoreStyle.track}; border-radius: 6px; height: 10px; overflow: hidden;">
          <div style="width: ${pct}%; background-color: ${scoreStyle.bg}; height: 10px; border-radius: 6px;"></div>
        </div>
      </td>
    </tr>
  </table>`;
}


// ─── Status Dot ────────────────────────────────────────────────
function statusDot(color, size = 8) {
  return `<span style="display:inline-block;width:${size}px;height:${size}px;border-radius:50%;background-color:${color};margin-right:6px;vertical-align:middle;"></span>`;
}


// ─── Greeting ──────────────────────────────────────────────────
function greeting(name, subtitle) {
  return `
    <h2 style="margin: 0 0 6px; font-family: ${BRAND.font}; font-size: 22px; font-weight: 700; color: ${BRAND.text}; line-height: 1.3;">Hi ${escapeHtml(name)},</h2>
    <p style="margin: 0 0 32px; font-family: ${BRAND.font}; font-size: 15px; line-height: 25px; color: ${BRAND.textSecondary};">${subtitle}</p>`;
}


// ─── Auto footer note ──────────────────────────────────────────
function autoFooter(msg) {
  return `<p style="margin: 32px 0 0; font-family: ${BRAND.font}; font-size: 12px; line-height: 18px; color: ${BRAND.muted}; text-align: center;">${escapeHtml(msg || `This notification was generated automatically by the ${BRAND.name} detection engine.`)}</p>`;
}


// ─── Wrapped detail table ──────────────────────────────────────
function detailTable(rows) {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 0; border: 1px solid ${BRAND.border}; border-radius: 8px; overflow: hidden;">
    ${rows}
  </table>`;
}


// ═══════════════════════════════════════════════════════════════
//  TEMPLATES
// ═══════════════════════════════════════════════════════════════
const emailTemplates = {

  // ── 1. PHISHING ALERT ──────────────────────────────────────────
  phishingAlert({
    userName,
    target,
    riskScore,
    classification,
    scanId,
    scanType = "url",
    scannedAt,
    detectedSignals = [],
    threatFeeds = [],
    domainAge = null,
    recommendations = [],
    frontendUrl,
  }) {
    const safeTarget = escapeHtml(target);
    const score = Number(riskScore) || 0;
    const scoreStyle = getScoreStyle(score);
    const classStyle = getClassificationStyle(classification);
    const formattedClass = formatClassification(classification);
    const scanTypeLabel = { url: "URL", email: "Email", sms: "SMS" }[scanType] || scanType.toUpperCase();
    const scanTime = formatDate(scannedAt);
    const threatAccent = getThreatAccent(classification);

    const isPhishing = classification.toLowerCase() === "phishing";
    const isSuspicious = classification.toLowerCase() === "suspicious";

    const subject = isPhishing
      ? `ALERT: Phishing Detected \u2014 Risk Score ${score}/100`
      : isSuspicious
      ? `Warning: Suspicious Content \u2014 Risk Score ${score}/100`
      : `Scan Complete \u2014 Content Appears Safe`;

    const defaultRecs = isPhishing ? [
      "Do NOT click any links in this content",
      "Do NOT enter any personal or financial information",
      "Mark the email as phishing in your email client if applicable",
      "Report it to your IT or security team",
      "Delete the message immediately",
    ] : isSuspicious ? [
      "Exercise extreme caution before interacting",
      "Verify the sender\u2019s identity through an official channel",
      "Do not provide personal or login credentials",
      "Contact support if you are unsure",
    ] : [
      "Content appears safe based on current threat data",
      "Always stay vigilant \u2014 threat intelligence updates continuously",
    ];

    const finalRecs = recommendations.length > 0 ? recommendations : defaultRecs;

    // ── Signals
    const signalsSection = detectedSignals.length > 0 ? `
      ${sectionLabel("Detection Signals")}
      <div style="margin-bottom: 4px;">
        ${detectedSignals.map(s => signalTag(s, isPhishing ? "danger" : "warning")).join("")}
      </div>` : "";

    // ── Threat feeds
    const feedsSection = threatFeeds.length > 0 ? `
      ${sectionLabel("Threat Intelligence")}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 4px; border: 1px solid ${BRAND.border}; border-radius: 8px; overflow: hidden;">
        ${threatFeeds.map((feed, i) => {
          const isLast = i === threatFeeds.length - 1;
          const vc = feed.verdict === "malicious" ? BRAND.danger : feed.verdict === "suspicious" ? BRAND.warning : BRAND.success;
          const vl = feed.verdict === "malicious" ? "MALICIOUS" : feed.verdict === "suspicious" ? "SUSPICIOUS" : "CLEAN";
          return `<tr>
            <td style="padding: 12px 20px; border-bottom: ${isLast ? "none" : `1px solid ${BRAND.borderLight}`}; background-color: ${BRAND.rowAlt}; width: 50%; vertical-align: middle;">
              <span style="font-family: ${BRAND.font}; font-size: 13px; font-weight: 600; color: ${BRAND.text};">${escapeHtml(feed.name)}</span>
            </td>
            <td style="padding: 12px 20px; border-bottom: ${isLast ? "none" : `1px solid ${BRAND.borderLight}`}; vertical-align: middle;">
              ${statusDot(vc)}<span style="font-family: ${BRAND.font}; font-size: 11px; font-weight: 700; color: ${vc}; letter-spacing: 0.5px;">${vl}</span>
            </td>
          </tr>`;
        }).join("")}
      </table>` : "";

    // ── Recommendations
    const recAccent = isPhishing ? BRAND.danger : isSuspicious ? BRAND.warning : BRAND.success;
    const recBg = isPhishing ? BRAND.dangerBg : isSuspicious ? BRAND.warningBg : BRAND.successBg;
    const recBorder = isPhishing ? BRAND.dangerBorder : isSuspicious ? BRAND.warningBorder : BRAND.successBorder;
    const recText = isPhishing ? BRAND.dangerDark : isSuspicious ? BRAND.warningDark : BRAND.successDark;

    const recsSection = `
      ${sectionLabel(isPhishing ? "Immediate Actions Required" : "Recommended Actions")}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 4px;">
        <tr>
          <td style="width: 5px; background-color: ${recAccent}; border-radius: 4px 0 0 4px;"></td>
          <td style="background-color: ${recBg}; padding: 22px 24px; border-radius: 0 8px 8px 0; border: 1px solid ${recBorder}; border-left: none;">
            ${finalRecs.map((rec, i) => `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" ${i < finalRecs.length - 1 ? 'style="margin-bottom: 10px;"' : ""}>
                <tr>
                  <td style="width: 26px; vertical-align: top; padding-top: 1px;">
                    <span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background-color: ${recAccent}; text-align: center; line-height: 20px; font-family: ${BRAND.font}; font-size: 11px; font-weight: 800; color: #ffffff;">${i + 1}</span>
                  </td>
                  <td style="vertical-align: top; padding-left: 8px;">
                    <p style="margin: 0; font-family: ${BRAND.font}; font-size: 13px; line-height: 21px; color: ${BRAND.text}; font-weight: 500;">${escapeHtml(rec)}</p>
                  </td>
                </tr>
              </table>`).join("")}
          </td>
        </tr>
      </table>`;

    const html = layout(`
      ${greeting(userName, `Your recent ${scanTypeLabel} scan has completed. Here are the results.`)}

      ${alertBanner(
        isPhishing ? `High-risk phishing threat detected \u2014 Risk Score ${score}/100` :
        isSuspicious ? `Suspicious content flagged \u2014 Risk Score ${score}/100` :
        "Content scanned \u2014 no significant threats detected",
        isPhishing ? "danger" : isSuspicious ? "warning" : "success"
      )}

      <!-- ── Risk Score Meter ── -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 28px; border: 1px solid ${BRAND.border}; border-radius: 10px; overflow: hidden;">
        <tr><td style="padding: 28px 28px 24px;">
          ${riskMeter(score, scoreStyle)}
        </td></tr>
      </table>

      <!-- ── Classification Badge ── -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 28px;">
        <tr>
          <td style="text-align: center;">
            <div style="display: inline-block; background-color: ${classStyle.bg}; border: 2px solid ${classStyle.border}; border-radius: 8px; padding: 12px 28px;">
              ${statusDot(classStyle.border, 10)}
              <span style="font-family: ${BRAND.font}; font-size: 16px; font-weight: 900; color: ${classStyle.color}; letter-spacing: 1.5px; vertical-align: middle;">${formattedClass}</span>
            </div>
          </td>
        </tr>
      </table>

      <!-- ── Scan Details ── -->
      ${sectionLabel("Scan Details")}
      ${detailTable(`
        ${detailRow("Scan Type", `<span style="display:inline-block;padding:3px 12px;border-radius:4px;background-color:${BRAND.infoBg};font-size:12px;font-weight:700;color:${BRAND.infoDark};letter-spacing:0.5px;">${scanTypeLabel}</span>`)}
        ${detailRow("Target", `<code style="font-family:${BRAND.mono};font-size:12px;color:${isPhishing ? BRAND.danger : BRAND.text};font-weight:600;background-color:${BRAND.rowAlt};padding:3px 8px;border-radius:4px;border:1px solid ${BRAND.borderLight};">${safeTarget}</code>`)}
        ${domainAge ? detailRow("Domain Age", `<span style="color:${BRAND.danger};font-weight:700;">${escapeHtml(domainAge)}</span> <span style="color:${BRAND.muted};font-size:12px;">\u2014 Recently registered domains are high-risk</span>`) : ""}
        ${detailRow("Scan ID", `<code style="font-family:${BRAND.mono};font-size:11px;color:${BRAND.muted};background-color:${BRAND.rowAlt};padding:3px 8px;border-radius:4px;border:1px solid ${BRAND.borderLight};">${escapeHtml(scanId)}</code>`)}
        ${detailRow("Scanned At", escapeHtml(scanTime), true)}
      `)}

      ${signalsSection}
      ${feedsSection}
      ${recsSection}

      ${ctaButton(`${frontendUrl}/scan/${scanId}`, "View Full Scan Report", isPhishing ? BRAND.danger : BRAND.accent)}

      ${autoFooter()}
    `, `${formattedClass} detected \u2014 Risk Score ${score}/100 for scanned ${scanTypeLabel}`, threatAccent);

    const text = [
      `Hi ${userName},`,
      "",
      `CYBERSENSE SECURITY ALERT`,
      `Classification: ${formattedClass} | Risk Score: ${score}/100`,
      "\u2500".repeat(50),
      "",
      `Scan Type: ${scanTypeLabel}`,
      `Target: ${target}`,
      domainAge ? `Domain Age: ${domainAge}` : "",
      `Scan ID: ${scanId}`,
      `Scanned At: ${scanTime}`,
      "",
      detectedSignals.length > 0 ? `Detection Signals: ${detectedSignals.join(", ")}` : "",
      "",
      threatFeeds.length > 0 ? "Threat Intelligence:\n" + threatFeeds.map(f => `  \u2022 ${f.name}: ${f.verdict.toUpperCase()}`).join("\n") : "",
      "",
      "RECOMMENDED ACTIONS:",
      ...finalRecs.map(r => `  \u2022 ${r}`),
      "",
      `View full report: ${normalizeUrl(`${frontendUrl}/scan/${scanId}`)}`,
    ].filter(Boolean).join("\n");

    return { subject, html, text };
  },

  // ── 2. EMAIL VERIFICATION ─────────────────────────────────────
  emailVerification({ otpCode, userName }) {
    const subject = `Your ${BRAND.name} verification code`;

    const html = layout(`
      <div style="text-align: center;">
        <!-- Icon container -->
        <div style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; background-color: ${BRAND.accentGlow}; border: 2px solid ${BRAND.accent}; text-align: center; line-height: 56px; margin-bottom: 24px;">
          <span style="font-family: ${BRAND.font}; font-size: 22px; font-weight: 900; color: ${BRAND.accent};">&#9993;</span>
        </div>
        <h2 style="margin: 0 0 8px; font-family: ${BRAND.font}; font-size: 26px; font-weight: 800; color: ${BRAND.text}; letter-spacing: -0.5px;">Welcome to ${BRAND.name}</h2>
        <p style="margin: 0 0 8px; font-family: ${BRAND.font}; font-size: 16px; color: ${BRAND.textSecondary};">Hi ${escapeHtml(userName)},</p>
        <p style="margin: 0 0 28px; font-family: ${BRAND.font}; font-size: 15px; line-height: 26px; color: ${BRAND.textSecondary}; max-width: 440px; margin-left: auto; margin-right: auto;">
          You&#8217;re one step away from protecting yourself against phishing threats. Enter the verification code below to activate your account.
        </p>

        <!-- OTP Code Block -->
        <div style="display: inline-block; padding: 20px 40px; background-color: #f0f4ff; border: 2px dashed ${BRAND.accent}; border-radius: 12px; margin-bottom: 8px;">
          <span style="font-family: ${BRAND.mono}; font-size: 36px; font-weight: 800; letter-spacing: 12px; color: ${BRAND.text};">${escapeHtml(otpCode)}</span>
        </div>
        <p style="margin: 12px 0 0; font-family: ${BRAND.font}; font-size: 13px; color: ${BRAND.muted};">Enter this code in the app to verify your email</p>
      </div>

      <!-- Expiry notice -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 36px;">
        <tr>
          <td style="padding: 16px 22px; background-color: ${BRAND.rowAlt}; border: 1px solid ${BRAND.border}; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-family: ${BRAND.font}; font-size: 13px; line-height: 22px; color: ${BRAND.textSecondary};">
              This code expires in <strong>24 hours</strong>. If you did not create a ${BRAND.name} account, you can safely ignore this email.
            </p>
          </td>
        </tr>
      </table>
    `, `Verify your email to activate your ${BRAND.name} account`);

    const text = [
      `Welcome to ${BRAND.name}, ${userName}.`,
      "",
      "Your verification code is:",
      otpCode,
      "",
      "Enter this code in the app to verify your email.",
      "Code expires in 24 hours.",
      "If you did not create this account, ignore this email.",
    ].join("\n");

    return { subject, html, text };
  },

  // ── 3. PASSWORD RESET ─────────────────────────────────────────
  passwordReset({ resetUrl, userName, expiryMinutes = 60 }) {
    const subject = `Reset your ${BRAND.name} password`;
    const safeResetUrl = normalizeUrl(resetUrl);

    const html = layout(`
      <div style="text-align: center;">
        <!-- Icon -->
        <div style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; background-color: ${BRAND.warningBg}; border: 2px solid ${BRAND.warning}; text-align: center; line-height: 56px; margin-bottom: 24px;">
          <span style="font-family: ${BRAND.font}; font-size: 24px; font-weight: 900; color: ${BRAND.warningDark};">&#128274;</span>
        </div>
        <h2 style="margin: 0 0 8px; font-family: ${BRAND.font}; font-size: 26px; font-weight: 800; color: ${BRAND.text}; letter-spacing: -0.5px;">Password Reset Request</h2>
        <p style="margin: 0 0 8px; font-family: ${BRAND.font}; font-size: 16px; color: ${BRAND.textSecondary};">Hi ${escapeHtml(userName)},</p>
        <p style="margin: 0 0 28px; font-family: ${BRAND.font}; font-size: 15px; line-height: 26px; color: ${BRAND.textSecondary}; max-width: 440px; margin-left: auto; margin-right: auto;">
          We received a request to reset the password on your ${BRAND.name} account. Use the secure link below to choose a new password.
        </p>
        ${ctaButton(safeResetUrl, "Reset Password", BRAND.warning)}
        <p style="margin: 20px 0 0; font-family: ${BRAND.font}; font-size: 12px; line-height: 20px; color: ${BRAND.muted}; word-break: break-all;">
          If the button does not work, copy and paste this link into your browser:<br>
          <a href="${escapeAttribute(safeResetUrl)}" style="color: ${BRAND.accent}; text-decoration: underline;">${escapeHtml(safeResetUrl)}</a>
        </p>
      </div>

      <!-- Expiry notice -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 36px;">
        <tr>
          <td style="padding: 16px 22px; background-color: ${BRAND.rowAlt}; border: 1px solid ${BRAND.border}; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-family: ${BRAND.font}; font-size: 13px; line-height: 22px; color: ${BRAND.textSecondary};">
              This reset link expires in <strong>${escapeHtml(expiryMinutes)} minutes</strong>. If you did not request this, your account may be at risk.
            </p>
          </td>
        </tr>
      </table>

      <div style="margin-top: 28px;">
        ${alertBanner("If you did not request a password reset, change your password immediately and contact support.", "warning")}
      </div>
    `, "Reset your CyberSense password", BRAND.warning);

    const text = [
      `Hi ${userName},`,
      "",
      "We received a request to reset your CyberSense password.",
      "",
      "Open this link to choose a new password:",
      safeResetUrl,
      "",
      `This reset link expires in ${expiryMinutes} minutes.`,
      "If you did not request this, change your password immediately and contact support.",
    ].join("\n");

    return { subject, html, text };
  },

  // ── 4. PASSWORD CHANGED ───────────────────────────────────────
  passwordChanged({ userName }) {
    const subject = `Security Alert: Your ${BRAND.name} password was changed`;

    const html = layout(`
      <div style="text-align: center;">
        <!-- Icon -->
        <div style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; background-color: ${BRAND.successBg}; border: 2px solid ${BRAND.success}; text-align: center; line-height: 56px; margin-bottom: 24px;">
          <span style="font-family: ${BRAND.font}; font-size: 24px; font-weight: 900; color: ${BRAND.successDark};">&#10003;</span>
        </div>
        <h2 style="margin: 0 0 8px; font-family: ${BRAND.font}; font-size: 26px; font-weight: 800; color: ${BRAND.text}; letter-spacing: -0.5px;">Password Changed</h2>
        <p style="margin: 0 0 8px; font-family: ${BRAND.font}; font-size: 16px; color: ${BRAND.textSecondary};">Hi ${escapeHtml(userName)},</p>
        <p style="margin: 0 0 32px; font-family: ${BRAND.font}; font-size: 15px; line-height: 26px; color: ${BRAND.textSecondary}; max-width: 440px; margin-left: auto; margin-right: auto;">
          Your ${BRAND.name} account password was successfully changed on <strong>${formatDate(new Date())}</strong>.
        </p>
      </div>

      ${alertBanner("Did not make this change? Contact support immediately \u2014 your account may be compromised.", "danger")}

      ${autoFooter("If you made this change, no further action is needed.")}
    `, "Your CyberSense password has been changed", BRAND.success);

    const text = [
      `Hi ${userName},`,
      "",
      `Your CyberSense password was changed on ${formatDate(new Date())}.`,
      "",
      "If you did not make this change, contact support immediately.",
    ].join("\n");

    return { subject, html, text };
  },

  // ── 5. REPORT STATUS UPDATE ───────────────────────────────────
  reportStatusUpdate({ userName, reportId, newStatus, notes, frontendUrl }) {
    const safeNotes = notes ? escapeHtml(notes) : null;

    const statusMap = {
      pending:        { label: "Pending Review",     color: BRAND.warning, bg: BRAND.warningBg, border: BRAND.warningBorder, msg: "Your report has been received and is queued for analyst review." },
      under_review:   { label: "Under Review",       color: BRAND.info,    bg: BRAND.infoBg,    border: BRAND.infoBorder,    msg: "A security analyst is actively reviewing your submission." },
      confirmed:      { label: "Confirmed Phishing", color: BRAND.danger,  bg: BRAND.dangerBg,  border: BRAND.dangerBorder,  msg: "Your report has been confirmed as a phishing threat. The domain has been added to our blocklist. Thank you for protecting our community." },
      false_positive: { label: "Safe \u2014 No Threat",   color: BRAND.success, bg: BRAND.successBg, border: BRAND.successBorder, msg: "Our analysts reviewed your submission and determined the content is safe. No action is needed." },
    };

    const si = statusMap[newStatus] || { label: newStatus, color: BRAND.accent, bg: BRAND.infoBg, border: BRAND.infoBorder, msg: "Your report status has been updated." };
    const subject = `Report Update: ${si.label} \u2014 ${reportId.slice(0, 8).toUpperCase()}`;

    const html = layout(`
      ${greeting(userName, "There\u2019s an update on your phishing report.")}

      <!-- Status hero card -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px; border-radius: 10px; overflow: hidden; border: 1px solid ${si.border};">
        <!-- Color bar -->
        <tr><td style="height: 6px; background-color: ${si.color};"></td></tr>
        <tr>
          <td style="padding: 32px 28px; background-color: ${si.bg}; text-align: center;">
            <!-- Status badge -->
            <div style="display: inline-block; padding: 6px 22px; background-color: ${si.color}; border-radius: 4px; font-family: ${BRAND.font}; font-size: 12px; font-weight: 800; color: #ffffff; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px;">
              ${si.label}
            </div>
            <p style="margin: 16px auto 0; font-family: ${BRAND.font}; font-size: 14px; line-height: 24px; color: ${BRAND.text}; max-width: 420px;">${si.msg}</p>
          </td>
        </tr>
      </table>

      ${sectionLabel("Report Details")}
      ${detailTable(`
        ${detailRow("Report ID", `<code style="font-family:${BRAND.mono};font-size:12px;background-color:${BRAND.rowAlt};padding:3px 8px;border-radius:4px;border:1px solid ${BRAND.borderLight};">${escapeHtml(reportId)}</code>`)}
        ${detailRow("Updated At", escapeHtml(formatDate(new Date())), !safeNotes)}
        ${safeNotes ? detailRow("Analyst Notes", `<em style="color:${BRAND.textSecondary};">${safeNotes}</em>`, true) : ""}
      `)}

      ${ctaButton(`${frontendUrl}/reports/${reportId}`, "View Report")}
    `, `Report ${reportId.slice(0, 8).toUpperCase()} \u2014 Status: ${si.label}`, si.color);

    const text = [
      `Hi ${userName},`,
      "",
      `Your report status has been updated to: ${si.label}`,
      "",
      si.msg,
      "",
      `Report ID: ${reportId}`,
      notes ? `Analyst Notes: ${notes}` : "",
      "",
      `View report: ${normalizeUrl(`${frontendUrl}/reports/${reportId}`)}`,
    ].filter(Boolean).join("\n");

    return { subject, html, text };
  },

  // ── 6. REPORT RECEIVED ────────────────────────────────────────
  reportReceived({ userName, reportId, reportType, frontendUrl }) {
    const safeType = escapeHtml(reportType);
    const subject = `We received your ${reportType} report \u2014 Thank you`;

    const html = layout(`
      ${greeting(userName, "Thank you for helping keep the community safe.")}
      ${alertBanner(`Your suspicious ${safeType} report has been received. Our team and detection engine will review it shortly.`, "success")}

      ${sectionLabel("Submission Details")}
      ${detailTable(`
        ${detailRow("Report Type", `<span style="display:inline-block;padding:3px 12px;border-radius:4px;background-color:${BRAND.infoBg};font-size:12px;font-weight:700;color:${BRAND.infoDark};letter-spacing:0.5px;">${safeType.toUpperCase()}</span>`)}
        ${detailRow("Report ID", `<code style="font-family:${BRAND.mono};font-size:12px;background-color:${BRAND.rowAlt};padding:3px 8px;border-radius:4px;border:1px solid ${BRAND.borderLight};">${escapeHtml(reportId)}</code>`)}
        ${detailRow("Submitted At", escapeHtml(formatDate(new Date())), true)}
      `)}

      <!-- Next steps -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 28px; background-color: ${BRAND.rowAlt}; border: 1px solid ${BRAND.border}; border-radius: 8px;">
        <tr>
          <td style="padding: 20px 24px;">
            <p style="margin: 0 0 6px; font-family: ${BRAND.font}; font-size: 14px; font-weight: 700; color: ${BRAND.text};">What happens next?</p>
            <p style="margin: 0; font-family: ${BRAND.font}; font-size: 13px; line-height: 23px; color: ${BRAND.textSecondary};">
              Our automated detection engine and security analysts will review your submission. You will receive an email notification when the status changes.
            </p>
          </td>
        </tr>
      </table>

      ${ctaButton(`${frontendUrl}/reports/${reportId}`, "Track Report Status")}
    `, `Report received \u2014 we'll review your ${reportType} submission shortly`, BRAND.success);

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

  // ── 7. NEW REPORT ALERT (for admins) ──────────────────────────
  newReportAlert({ adminName, reportId, reporterEmail, reportType, riskScore, classification, frontendUrl }) {
    const score = Number(riskScore) || 0;
    const scoreStyle = getScoreStyle(score);
    const classStyle = getClassificationStyle(classification);
    const subject = `Action Required: New ${reportType.toUpperCase()} Report \u2014 Risk ${score}/100`;

    const html = layout(`
      ${greeting(adminName, "A new report has been submitted and requires analyst review.")}
      ${alertBanner(`New ${reportType} report submitted \u2014 Risk Score ${score}/100. Requires immediate review.`, score >= 75 ? "danger" : "warning")}

      <!-- Inline risk meter -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 28px; border: 1px solid ${BRAND.border}; border-radius: 10px; overflow: hidden;">
        <tr><td style="padding: 24px 28px;">
          ${riskMeter(score, scoreStyle)}
        </td></tr>
      </table>

      ${sectionLabel("Report Summary")}
      ${detailTable(`
        ${detailRow("Report Type", `<span style="display:inline-block;padding:3px 12px;border-radius:4px;background-color:${BRAND.infoBg};font-size:12px;font-weight:700;color:${BRAND.infoDark};letter-spacing:0.5px;">${reportType.toUpperCase()}</span>`)}
        ${detailRow("Submitted By", `<a href="mailto:${escapeAttribute(reporterEmail)}" style="color:${BRAND.accent};font-weight:600;">${escapeHtml(reporterEmail)}</a>`)}
        ${detailRow("Report ID", `<code style="font-family:${BRAND.mono};font-size:12px;background-color:${BRAND.rowAlt};padding:3px 8px;border-radius:4px;border:1px solid ${BRAND.borderLight};">${escapeHtml(reportId)}</code>`)}
        ${detailRow("Classification", `${statusDot(classStyle.border, 10)}<span style="font-weight:700;color:${classStyle.color};letter-spacing:0.5px;">${formatClassification(classification)}</span>`, true)}
      `)}

      ${ctaButton(`${frontendUrl}/admin/reports/${reportId}`, "Review Report", BRAND.accentDark)}
    `, `New ${reportType} report \u2014 Risk Score ${score}/100 awaiting review`, score >= 75 ? BRAND.danger : BRAND.warning);

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

  // ── 8. MFA ENABLED ────────────────────────────────────────────
  mfaEnabled({ userName }) {
    const subject = `Security Update: Two-Factor Authentication Enabled`;

    const html = layout(`
      <div style="text-align: center;">
        <div style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; background-color: ${BRAND.successBg}; border: 2px solid ${BRAND.success}; text-align: center; line-height: 56px; margin-bottom: 24px;">
          <span style="font-family: ${BRAND.font}; font-size: 22px; font-weight: 900; color: ${BRAND.successDark};">&#9670;</span>
        </div>
        <h2 style="margin: 0 0 8px; font-family: ${BRAND.font}; font-size: 26px; font-weight: 800; color: ${BRAND.text}; letter-spacing: -0.5px;">2FA Enabled</h2>
        <p style="margin: 0 0 8px; font-family: ${BRAND.font}; font-size: 16px; color: ${BRAND.textSecondary};">Hi ${escapeHtml(userName)},</p>
      </div>

      ${alertBanner("Two-Factor Authentication (2FA) has been successfully enabled on your account. Your account is now significantly more secure.", "success")}

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.rowAlt}; border: 1px solid ${BRAND.border}; border-radius: 8px;">
        <tr>
          <td style="padding: 20px 24px;">
            <p style="margin: 0 0 6px; font-family: ${BRAND.font}; font-size: 14px; font-weight: 700; color: ${BRAND.text};">What you should know</p>
            <p style="margin: 0; font-family: ${BRAND.font}; font-size: 13px; line-height: 23px; color: ${BRAND.textSecondary};">
              From now on you will need your authenticator app each time you sign in. Keep your backup codes in a safe place \u2014 you will need them if you lose access to your authenticator.
            </p>
          </td>
        </tr>
      </table>

      ${autoFooter("If you did not enable 2FA, contact support immediately.")}
    `, "2FA enabled on your CyberSense account", BRAND.success);

    const text = [`Hi ${userName},`, "", "Two-Factor Authentication has been enabled on your CyberSense account.", "Your account is now more secure.", "", "If you did not make this change, contact support immediately."].join("\n");
    return { subject, html, text };
  },

  // ── 9. MFA DISABLED ───────────────────────────────────────────
  mfaDisabled({ userName }) {
    const subject = `Security Alert: Two-Factor Authentication Disabled`;

    const html = layout(`
      <div style="text-align: center;">
        <div style="display: inline-block; width: 56px; height: 56px; border-radius: 50%; background-color: ${BRAND.dangerBg}; border: 2px solid ${BRAND.danger}; text-align: center; line-height: 56px; margin-bottom: 24px;">
          <span style="font-family: ${BRAND.font}; font-size: 24px; font-weight: 900; color: ${BRAND.dangerDark};">&#9888;</span>
        </div>
        <h2 style="margin: 0 0 8px; font-family: ${BRAND.font}; font-size: 26px; font-weight: 800; color: ${BRAND.text}; letter-spacing: -0.5px;">2FA Disabled</h2>
        <p style="margin: 0 0 8px; font-family: ${BRAND.font}; font-size: 16px; color: ${BRAND.textSecondary};">Hi ${escapeHtml(userName)},</p>
      </div>

      ${alertBanner("Two-Factor Authentication has been DISABLED on your account. Your account is now less secure.", "danger")}

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${BRAND.dangerBg}; border: 1px solid ${BRAND.dangerBorder}; border-radius: 8px;">
        <tr>
          <td style="padding: 20px 24px;">
            <p style="margin: 0 0 6px; font-family: ${BRAND.font}; font-size: 14px; font-weight: 700; color: ${BRAND.dangerDark};">Didn&#8217;t do this?</p>
            <p style="margin: 0; font-family: ${BRAND.font}; font-size: 13px; line-height: 23px; color: ${BRAND.text};">
              If you did not disable 2FA, your account may be compromised. Change your password immediately and contact our support team at <a href="mailto:support@cybersense.io" style="color:${BRAND.accent};font-weight:600;">support@cybersense.io</a>.
            </p>
          </td>
        </tr>
      </table>

      ${autoFooter()}
    `, "ALERT: 2FA disabled on your CyberSense account", BRAND.danger);

    const text = [`Hi ${userName},`, "", "Two-Factor Authentication has been DISABLED on your CyberSense account.", "", "If you did not make this change, your account may be compromised. Contact support immediately."].join("\n");
    return { subject, html, text };
  },

};

module.exports = emailTemplates;
