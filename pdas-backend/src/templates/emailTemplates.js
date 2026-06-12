/**
 * Professional HTML email templates for the PDAS platform.
 *
 * Brand style:
 *   Header background : #1a1a2e
 *   Accent / CTA      : #4361ee
 *   Body background    : #f5f5f5
 *   Card background    : #ffffff
 *   Text colour        : #333333
 *   Font               : Arial, sans-serif
 *   Max-width          : 600px, centred
 */

// ── shared helpers ──────────────────────────────────────────────────────────────

function layout(bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background-color:#1a1a2e;padding:30px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">PDAS</h1>
            <p style="margin:4px 0 0;color:#a0a0c0;font-size:12px;">Phishing Detection &amp; Awareness System</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            ${bodyContent}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #eeeeee;">
            <p style="margin:0;color:#999999;font-size:12px;">© ${new Date().getFullYear()} PDAS — Phishing Detection &amp; Awareness System</p>
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
    <td style="background-color:#4361ee;border-radius:6px;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;">${label}</a>
    </td>
  </tr>
</table>`;
}

// ── templates ───────────────────────────────────────────────────────────────────

const emailTemplates = {
  /**
   * Password reset request
   */
  passwordReset({ resetUrl, userName }) {
    const subject = "Reset your PDAS password";

    const html = layout(`
      <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">Hi ${userName},</h2>
      <p style="color:#333333;font-size:15px;line-height:1.6;">
        We received a request to reset the password for your PDAS account. Click the button below to choose a new password:
      </p>
      ${ctaButton(resetUrl, "Reset Password")}
      <p style="color:#666666;font-size:13px;line-height:1.5;text-align:center;">
        This link <strong>expires in 1 hour</strong>. If it has expired, you can request a new one.
      </p>
      <hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;">
      <p style="color:#999999;font-size:12px;line-height:1.5;">
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    `);

    const text = [
      `Hi ${userName},`,
      "",
      "We received a request to reset your PDAS password.",
      "",
      `Reset your password: ${resetUrl}`,
      "",
      "This link expires in 1 hour.",
      "",
      "If you didn't request this, please ignore this email.",
    ].join("\n");

    return { subject, html, text };
  },

  /**
   * Password changed confirmation
   */
  passwordChanged({ userName }) {
    const subject = "Your PDAS password has been changed";

    const html = layout(`
      <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">Hi ${userName},</h2>
      <p style="color:#333333;font-size:15px;line-height:1.6;">
        Your PDAS account password was successfully changed. If you made this change, no further action is required.
      </p>
      <div style="background-color:#fff3cd;border-left:4px solid #ffc107;padding:16px;border-radius:4px;margin:24px 0;">
        <p style="margin:0;color:#856404;font-size:14px;line-height:1.5;">
          <strong>Didn't make this change?</strong> Contact support immediately and reset your password to secure your account.
        </p>
      </div>
    `);

    const text = [
      `Hi ${userName},`,
      "",
      "Your PDAS account password was successfully changed.",
      "",
      "If you didn't make this change, contact support immediately.",
    ].join("\n");

    return { subject, html, text };
  },

  /**
   * Email verification
   */
  emailVerification({ verifyUrl, userName }) {
    const subject = "Verify your PDAS account";

    const html = layout(`
      <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">Welcome, ${userName}!</h2>
      <p style="color:#333333;font-size:15px;line-height:1.6;">
        Thanks for creating a PDAS account. Please verify your email address by clicking the button below:
      </p>
      ${ctaButton(verifyUrl, "Verify Email")}
      <p style="color:#666666;font-size:13px;line-height:1.5;text-align:center;">
        This link <strong>expires in 24 hours</strong>. If it has expired, you can request a new verification email.
      </p>
      <hr style="border:none;border-top:1px solid #eeeeee;margin:24px 0;">
      <p style="color:#999999;font-size:12px;line-height:1.5;">
        If you didn't create a PDAS account, you can safely ignore this email.
      </p>
    `);

    const text = [
      `Welcome, ${userName}!`,
      "",
      "Thanks for creating a PDAS account. Please verify your email address:",
      "",
      `Verify your email: ${verifyUrl}`,
      "",
      "This link expires in 24 hours.",
      "",
      "If you didn't create this account, please ignore this email.",
    ].join("\n");

    return { subject, html, text };
  },

  /**
   * Phishing scan alert
   */
  phishingAlert({ userName, target, riskScore, classification, scanId, frontendUrl }) {
    const subject = "⚠️ Phishing detected in your scan";

    const scoreBadge =
      riskScore >= 75
        ? 'background-color:#dc3545;color:#ffffff;'
        : riskScore >= 50
          ? 'background-color:#fd7e14;color:#ffffff;'
          : 'background-color:#ffc107;color:#333333;';

    const html = layout(`
      <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">Hi ${userName},</h2>
      <div style="background-color:#f8d7da;border-left:4px solid #dc3545;padding:16px;border-radius:4px;margin:0 0 24px;">
        <p style="margin:0;color:#721c24;font-size:14px;font-weight:600;">
          ⚠️ Potential phishing threat detected
        </p>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="padding:8px 0;color:#666666;font-size:13px;border-bottom:1px solid #eeeeee;width:120px;"><strong>Target URL</strong></td>
          <td style="padding:8px 0;color:#333333;font-size:13px;border-bottom:1px solid #eeeeee;word-break:break-all;">${target}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666666;font-size:13px;border-bottom:1px solid #eeeeee;"><strong>Risk Score</strong></td>
          <td style="padding:8px 0;border-bottom:1px solid #eeeeee;">
            <span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600;${scoreBadge}">${riskScore}/100</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666666;font-size:13px;"><strong>Classification</strong></td>
          <td style="padding:8px 0;color:#333333;font-size:13px;">${classification}</td>
        </tr>
      </table>
      ${ctaButton(`${frontendUrl}/scan/${scanId}`, "View Full Results")}
    `);

    const text = [
      `Hi ${userName},`,
      "",
      "⚠️ Potential phishing threat detected",
      "",
      `Target URL   : ${target}`,
      `Risk Score   : ${riskScore}/100`,
      `Classification: ${classification}`,
      "",
      `View full results: ${frontendUrl}/scan/${scanId}`,
    ].join("\n");

    return { subject, html, text };
  },

  /**
   * Report status update
   */
  reportStatusUpdate({ userName, reportId, newStatus, notes, frontendUrl }) {
    const subject = "Your report status has been updated";

    const statusColors = {
      pending: "background-color:#ffc107;color:#333333;",
      investigating: "background-color:#17a2b8;color:#ffffff;",
      resolved: "background-color:#28a745;color:#ffffff;",
      dismissed: "background-color:#6c757d;color:#ffffff;",
    };
    const statusStyle = statusColors[newStatus] || "background-color:#6c757d;color:#ffffff;";

    const notesSection = notes
      ? `<div style="background-color:#f8f9fa;border-left:4px solid #4361ee;padding:16px;border-radius:4px;margin:16px 0;">
          <p style="margin:0 0 4px;color:#666666;font-size:12px;font-weight:600;">ANALYST NOTES</p>
          <p style="margin:0;color:#333333;font-size:14px;line-height:1.5;">${notes}</p>
        </div>`
      : "";

    const html = layout(`
      <h2 style="margin:0 0 16px;color:#333333;font-size:20px;">Hi ${userName},</h2>
      <p style="color:#333333;font-size:15px;line-height:1.6;">
        There has been an update to one of your phishing reports:
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0 24px;">
        <tr>
          <td style="padding:8px 0;color:#666666;font-size:13px;border-bottom:1px solid #eeeeee;width:120px;"><strong>Report ID</strong></td>
          <td style="padding:8px 0;color:#333333;font-size:13px;border-bottom:1px solid #eeeeee;font-family:monospace;">${reportId}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666666;font-size:13px;"><strong>New Status</strong></td>
          <td style="padding:8px 0;">
            <span style="display:inline-block;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600;${statusStyle}">${newStatus}</span>
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
      `Report ID : ${reportId}`,
      `New Status: ${newStatus}`,
      notes ? `Notes     : ${notes}` : "",
      "",
      `View report: ${frontendUrl}/reports/${reportId}`,
    ]
      .filter(Boolean)
      .join("\n");

    return { subject, html, text };
  },
};

module.exports = emailTemplates;
