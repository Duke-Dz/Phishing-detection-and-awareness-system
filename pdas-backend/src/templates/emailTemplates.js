const BRAND = {
  name: "CyberSense",
  header: "#1a1a2e",
  accent: "#4361ee",
  background: "#f5f5f5",
  card: "#ffffff",
  text: "#333333",
  muted: "#666666",
};

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

function layout(bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${BRAND.background};font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.background};">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BRAND.card};border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background-color:${BRAND.header};padding:30px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">${BRAND.name}</h1>
            <p style="margin:4px 0 0;color:#a0a0c0;font-size:12px;">Security Platform</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            ${bodyContent}
          </td>
        </tr>
        <tr>
          <td style="background-color:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #eeeeee;">
            <p style="margin:0;color:#999999;font-size:12px;">&copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(url, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px auto;">
  <tr>
    <td style="background-color:${BRAND.accent};border-radius:6px;">
      <a href="${escapeAttribute(normalizeUrl(url))}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

const scoreBadgeStyle = (riskScore) => {
  if (riskScore >= 75) return "background-color:#dc3545;color:#ffffff;";
  if (riskScore >= 50) return "background-color:#fd7e14;color:#ffffff;";
  return "background-color:#ffc107;color:#333333;";
};

const emailTemplates = {
  passwordReset({ resetUrl, userName }) {
    const safeName = escapeHtml(userName);
    const subject = "Reset your CyberSense password";

    const html = layout(`
      <h2 style="margin:0 0 16px;color:${BRAND.text};font-size:20px;">Hi ${safeName},</h2>
      <p style="color:${BRAND.text};font-size:15px;line-height:1.6;">
        We received a request to reset the password for your CyberSense account. Use the button below to choose a new password.
      </p>
      ${ctaButton(resetUrl, "Reset Password")}
      <p style="color:${BRAND.muted};font-size:13px;line-height:1.5;text-align:center;">
        This link <strong>expires in 1 hour</strong>. If it expires, request a new one.
      </p>
      <hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;">
      <p style="color:#999999;font-size:12px;line-height:1.5;">
        If you did not request a password reset, you can ignore this email.
      </p>
    `);

    const text = [
      `Hi ${userName},`,
      "",
      "We received a request to reset your CyberSense password.",
      "",
      `Reset your password: ${normalizeUrl(resetUrl)}`,
      "",
      "This link expires in 1 hour.",
      "",
      "If you did not request this, ignore this email.",
    ].join("\n");

    return { subject, html, text };
  },

  passwordChanged({ userName }) {
    const safeName = escapeHtml(userName);
    const subject = "Your CyberSense password has been changed";

    const html = layout(`
      <h2 style="margin:0 0 16px;color:${BRAND.text};font-size:20px;">Hi ${safeName},</h2>
      <p style="color:${BRAND.text};font-size:15px;line-height:1.6;">
        Your CyberSense account password was successfully changed. If you made this change, no further action is required.
      </p>
      <div style="background-color:#fff3cd;border-left:4px solid #ffc107;padding:16px;border-radius:4px;margin:24px 0;">
        <p style="margin:0;color:#856404;font-size:14px;line-height:1.5;">
          <strong>Did not make this change?</strong> Contact support immediately and reset your password.
        </p>
      </div>
    `);

    const text = [
      `Hi ${userName},`,
      "",
      "Your CyberSense account password was successfully changed.",
      "",
      "If you did not make this change, contact support immediately.",
    ].join("\n");

    return { subject, html, text };
  },

  emailVerification({ verifyUrl, userName }) {
    const safeName = escapeHtml(userName);
    const subject = "Verify your CyberSense account";

    const html = layout(`
      <h2 style="margin:0 0 16px;color:${BRAND.text};font-size:20px;">Welcome, ${safeName}.</h2>
      <p style="color:${BRAND.text};font-size:15px;line-height:1.6;">
        Thanks for creating a CyberSense account. Verify your email address to finish setting up your account.
      </p>
      ${ctaButton(verifyUrl, "Verify Email")}
      <p style="color:${BRAND.muted};font-size:13px;line-height:1.5;text-align:center;">
        This link <strong>expires in 24 hours</strong>.
      </p>
      <hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;">
      <p style="color:#999999;font-size:12px;line-height:1.5;">
        If you did not create a CyberSense account, you can ignore this email.
      </p>
    `);

    const text = [
      `Welcome, ${userName}.`,
      "",
      "Thanks for creating a CyberSense account. Please verify your email address:",
      "",
      `Verify your email: ${normalizeUrl(verifyUrl)}`,
      "",
      "This link expires in 24 hours.",
    ].join("\n");

    return { subject, html, text };
  },

  phishingAlert({ userName, target, riskScore, classification, scanId, frontendUrl }) {
    const safeName = escapeHtml(userName);
    const safeTarget = escapeHtml(target);
    const safeClassification = escapeHtml(classification);
    const score = Number(riskScore) || 0;
    const subject = "Phishing detected in your scan";

    const html = layout(`
      <h2 style="margin:0 0 16px;color:${BRAND.text};font-size:20px;">Hi ${safeName},</h2>
      <div style="background-color:#f8d7da;border-left:4px solid #dc3545;padding:16px;border-radius:4px;margin:0 0 24px;">
        <p style="margin:0;color:#721c24;font-size:14px;font-weight:600;">
          Potential phishing threat detected
        </p>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="padding:8px 0;color:${BRAND.muted};font-size:13px;border-bottom:1px solid #eeeeee;width:120px;"><strong>Target URL</strong></td>
          <td style="padding:8px 0;color:${BRAND.text};font-size:13px;border-bottom:1px solid #eeeeee;word-break:break-all;">${safeTarget}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${BRAND.muted};font-size:13px;border-bottom:1px solid #eeeeee;"><strong>Risk Score</strong></td>
          <td style="padding:8px 0;border-bottom:1px solid #eeeeee;">
            <span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600;${scoreBadgeStyle(score)}">${score}/100</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${BRAND.muted};font-size:13px;"><strong>Classification</strong></td>
          <td style="padding:8px 0;color:${BRAND.text};font-size:13px;">${safeClassification}</td>
        </tr>
      </table>
      ${ctaButton(`${frontendUrl}/scan/${scanId}`, "View Full Results")}
    `);

    const text = [
      `Hi ${userName},`,
      "",
      "Potential phishing threat detected.",
      "",
      `Target URL: ${target}`,
      `Risk Score: ${score}/100`,
      `Classification: ${classification}`,
      "",
      `View full results: ${normalizeUrl(`${frontendUrl}/scan/${scanId}`)}`,
    ].join("\n");

    return { subject, html, text };
  },

  reportStatusUpdate({ userName, reportId, newStatus, notes, frontendUrl }) {
    const safeName = escapeHtml(userName);
    const safeReportId = escapeHtml(reportId);
    const safeStatus = escapeHtml(newStatus);
    const safeNotes = notes ? escapeHtml(notes) : null;
    const subject = "Your report status has been updated";

    const statusColors = {
      pending: "background-color:#ffc107;color:#333333;",
      under_review: "background-color:#17a2b8;color:#ffffff;",
      confirmed: "background-color:#dc3545;color:#ffffff;",
      false_positive: "background-color:#28a745;color:#ffffff;",
    };
    const statusStyle = statusColors[newStatus] || "background-color:#6c757d;color:#ffffff;";

    const notesSection = safeNotes
      ? `<div style="background-color:#f8f9fa;border-left:4px solid ${BRAND.accent};padding:16px;border-radius:4px;margin:16px 0;">
          <p style="margin:0 0 4px;color:${BRAND.muted};font-size:12px;font-weight:600;">ANALYST NOTES</p>
          <p style="margin:0;color:${BRAND.text};font-size:14px;line-height:1.5;">${safeNotes}</p>
        </div>`
      : "";

    const html = layout(`
      <h2 style="margin:0 0 16px;color:${BRAND.text};font-size:20px;">Hi ${safeName},</h2>
      <p style="color:${BRAND.text};font-size:15px;line-height:1.6;">
        There has been an update to one of your phishing reports.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;">
        <tr>
          <td style="padding:8px 0;color:${BRAND.muted};font-size:13px;border-bottom:1px solid #eeeeee;width:120px;"><strong>Report ID</strong></td>
          <td style="padding:8px 0;color:${BRAND.text};font-size:13px;border-bottom:1px solid #eeeeee;font-family:monospace;">${safeReportId}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:${BRAND.muted};font-size:13px;"><strong>New Status</strong></td>
          <td style="padding:8px 0;">
            <span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600;${statusStyle}">${safeStatus}</span>
          </td>
        </tr>
      </table>
      ${notesSection}
      ${ctaButton(`${frontendUrl}/reports/${reportId}`, "View Report")}
    `);

    const text = [
      `Hi ${userName},`,
      "",
      "Your phishing report has been updated:",
      "",
      `Report ID: ${reportId}`,
      `New Status: ${newStatus}`,
      notes ? `Notes: ${notes}` : "",
      "",
      `View report: ${normalizeUrl(`${frontendUrl}/reports/${reportId}`)}`,
    ]
      .filter(Boolean)
      .join("\n");

    return { subject, html, text };
  },
};

module.exports = emailTemplates;
