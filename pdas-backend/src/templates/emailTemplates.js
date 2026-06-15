const BRAND = {
  name: "CyberSense",
  header: "#1a1a2e",
  accent: "#4361ee",
  background: "#f4f7f6",
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

/**
 * Universal, standard HTML email layout verified across desktop, web, and mobile clients.
 */
function layout(bodyContent) {
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
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* CSS Reset */
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
    }
    * {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin: 0 auto !important;
    }
    img {
      -ms-interpolation-mode: bicubic;
    }
    a {
      text-decoration: none;
    }
    /* iOS BLUE LINKS */
    a[x-apple-data-detectors],
    .unstyle-auto-detected-links a,
    .aBn {
      border-bottom: 0 !important;
      cursor: default !important;
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    /* Gmail blue links */
    u + #body a,
    #MessageViewBody a {
      color: inherit;
      text-decoration: none;
      font-size: inherit;
      font-family: inherit;
      font-weight: inherit;
      line-height: inherit;
    }
  </style>
</head>
<body id="body" width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: ${BRAND.background};">
  <center role="article" aria-roledescription="email" lang="en" style="width: 100%; background-color: ${BRAND.background};">
    <!--[if mso | IE]>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${BRAND.background};">
    <tr>
    <td>
    <![endif]-->

      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;" class="email-container">
        <!--[if mso]>
        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600">
        <tr>
        <td>
        <![endif]-->
        <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto; background-color: ${BRAND.card}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; text-align: center; background-color: ${BRAND.header};">
              <h1 style="margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 28px; line-height: 32px; color: #ffffff; font-weight: bold;">
                ${BRAND.name}
              </h1>
              <p style="margin: 8px 0 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 14px; line-height: 20px; color: #a0a0c0;">
                Security Platform
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px; background-color: ${BRAND.card};">
              <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: ${BRAND.text};">
                ${bodyContent}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #fafafa; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; line-height: 18px; color: #888888;">
                You are receiving this email because of your association with ${BRAND.name}.
              </p>
              <p style="margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; line-height: 18px; color: #888888;">
                &copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </div>

    <!--[if mso | IE]>
    </td>
    </tr>
    </table>
    <![endif]-->
  </center>
</body>
</html>`;
}

function ctaButton(url, label) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 30px auto;">
  <tr>
    <td style="border-radius: 6px; background: ${BRAND.accent}; text-align: center;" class="button-td">
      <a href="${escapeAttribute(normalizeUrl(url))}" target="_blank" style="background: ${BRAND.accent}; border: 1px solid ${BRAND.accent}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; line-height: 1.1; text-align: center; text-decoration: none; display: block; border-radius: 6px; font-weight: bold; padding: 14px 32px; color: #ffffff;" class="button-a">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

const scoreBadgeStyle = (riskScore) => {
  if (riskScore >= 75) return "background-color: #dc3545; color: #ffffff;";
  if (riskScore >= 50) return "background-color: #fd7e14; color: #ffffff;";
  return "background-color: #ffc107; color: #333333;";
};

const emailTemplates = {
  passwordReset({ resetUrl, userName }) {
    const safeName = escapeHtml(userName);
    const subject = "Reset your CyberSense password";

    const html = layout(`
      <h2 style="margin: 0 0 16px; font-size: 20px; line-height: 28px; color: ${BRAND.text};">Hi ${safeName},</h2>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: ${BRAND.text};">
        We received a request to reset the password for your CyberSense account. Use the button below to choose a new password.
      </p>
      ${ctaButton(resetUrl, "Reset Password")}
      <p style="margin: 0 0 24px; font-size: 13px; line-height: 20px; color: ${BRAND.muted}; text-align: center;">
        This link <strong>expires in 1 hour</strong>. If it expires, request a new one.
      </p>
      <hr style="border: none; border-top: 1px solid #eeeeee; margin: 24px 0;">
      <p style="margin: 0; font-size: 12px; line-height: 18px; color: #999999;">
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
      <h2 style="margin: 0 0 16px; font-size: 20px; line-height: 28px; color: ${BRAND.text};">Hi ${safeName},</h2>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: ${BRAND.text};">
        Your CyberSense account password was successfully changed. If you made this change, no further action is required.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; line-height: 22px; color: #856404;">
              <strong>Did not make this change?</strong> Contact support immediately to secure your account.
            </p>
          </td>
        </tr>
      </table>
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
      <h2 style="margin: 0 0 16px; font-size: 20px; line-height: 28px; color: ${BRAND.text};">Welcome, ${safeName}.</h2>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: ${BRAND.text};">
        Thanks for creating a CyberSense account. Verify your email address to finish setting up your account.
      </p>
      ${ctaButton(verifyUrl, "Verify Email")}
      <p style="margin: 0 0 24px; font-size: 13px; line-height: 20px; color: ${BRAND.muted}; text-align: center;">
        This link <strong>expires in 24 hours</strong>.
      </p>
      <hr style="border: none; border-top: 1px solid #eeeeee; margin: 24px 0;">
      <p style="margin: 0; font-size: 12px; line-height: 18px; color: #999999;">
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
      <h2 style="margin: 0 0 16px; font-size: 20px; line-height: 28px; color: ${BRAND.text};">Hi ${safeName},</h2>
      
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 16px; border-radius: 4px;">
            <p style="margin: 0; color: #721c24; font-size: 15px; font-weight: bold;">
              Potential phishing threat detected
            </p>
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; border: 1px solid #eeeeee; border-radius: 4px; overflow: hidden;">
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eeeeee; width: 35%; background-color: #fbfbfb;">
            <strong style="color: ${BRAND.muted}; font-size: 13px;">Target URL</strong>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eeeeee; color: ${BRAND.text}; font-size: 13px; word-break: break-all;">
            ${safeTarget}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eeeeee; background-color: #fbfbfb;">
            <strong style="color: ${BRAND.muted}; font-size: 13px;">Risk Score</strong>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eeeeee;">
            <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: bold; ${scoreBadgeStyle(score)}">
              ${score}/100
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; background-color: #fbfbfb;">
            <strong style="color: ${BRAND.muted}; font-size: 13px;">Classification</strong>
          </td>
          <td style="padding: 12px 16px; color: ${BRAND.text}; font-size: 13px;">
            ${safeClassification}
          </td>
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
      pending: "background-color: #ffc107; color: #333333;",
      under_review: "background-color: #17a2b8; color: #ffffff;",
      confirmed: "background-color: #dc3545; color: #ffffff;",
      false_positive: "background-color: #28a745; color: #ffffff;",
    };
    const statusStyle = statusColors[newStatus] || "background-color: #6c757d; color: #ffffff;";

    const notesSection = safeNotes
      ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
          <tr>
            <td style="background-color: #f8f9fa; border-left: 4px solid ${BRAND.accent}; padding: 16px; border-radius: 4px;">
              <p style="margin: 0 0 6px; color: ${BRAND.muted}; font-size: 12px; font-weight: bold; letter-spacing: 0.5px;">ANALYST NOTES</p>
              <p style="margin: 0; color: ${BRAND.text}; font-size: 14px; line-height: 22px;">${safeNotes}</p>
            </td>
          </tr>
        </table>`
      : "";

    const html = layout(`
      <h2 style="margin: 0 0 16px; font-size: 20px; line-height: 28px; color: ${BRAND.text};">Hi ${safeName},</h2>
      <p style="margin: 0 0 20px; font-size: 15px; line-height: 24px; color: ${BRAND.text};">
        There has been an update to one of your phishing reports.
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; border: 1px solid #eeeeee; border-radius: 4px; overflow: hidden;">
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eeeeee; width: 35%; background-color: #fbfbfb;">
            <strong style="color: ${BRAND.muted}; font-size: 13px;">Report ID</strong>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eeeeee; color: ${BRAND.text}; font-size: 13px; font-family: 'Courier New', Courier, monospace;">
            ${safeReportId}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; background-color: #fbfbfb;">
            <strong style="color: ${BRAND.muted}; font-size: 13px;">New Status</strong>
          </td>
          <td style="padding: 12px 16px;">
            <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: bold; ${statusStyle}">
              ${safeStatus}
            </span>
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

  mfaEnabled({ userName }) {
    const safeName = escapeHtml(userName);
    const subject = "Multi-Factor Authentication Enabled";

    const html = layout(`
      <h2 style="margin: 0 0 16px; font-size: 20px; line-height: 28px; color: ${BRAND.text};">Hi ${safeName},</h2>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: ${BRAND.text};">
        Multi-Factor Authentication (MFA) has been successfully enabled on your CyberSense account.
      </p>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: ${BRAND.text};">
        Your account is now more secure. You will need to enter a code from your authenticator app whenever you sign in.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="background-color: #e2e3e5; border-left: 4px solid #6c757d; padding: 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; line-height: 22px; color: #383d41;">
              <strong>Did not make this change?</strong> Please contact support immediately to secure your account.
            </p>
          </td>
        </tr>
      </table>
    `);

    const text = [
      `Hi ${userName},`,
      "",
      "Multi-Factor Authentication (MFA) has been successfully enabled on your CyberSense account.",
      "Your account is now more secure.",
      "",
      "If you did not make this change, contact support immediately.",
    ].join("\n");

    return { subject, html, text };
  },

  mfaDisabled({ userName }) {
    const safeName = escapeHtml(userName);
    const subject = "Security Alert: Multi-Factor Authentication Disabled";

    const html = layout(`
      <h2 style="margin: 0 0 16px; font-size: 20px; line-height: 28px; color: ${BRAND.text};">Hi ${safeName},</h2>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: ${BRAND.text};">
        Multi-Factor Authentication (MFA) has been <strong>disabled</strong> on your CyberSense account.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; line-height: 22px; color: #856404;">
              <strong>Did not make this change?</strong> Your account may be compromised. Contact support immediately to secure your account.
            </p>
          </td>
        </tr>
      </table>
    `);

    const text = [
      `Hi ${userName},`,
      "",
      "Multi-Factor Authentication (MFA) has been disabled on your CyberSense account.",
      "",
      "If you did not make this change, your account may be compromised. Contact support immediately.",
    ].join("\n");

    return { subject, html, text };
  },

  reportReceived({ userName, reportId, reportType, frontendUrl }) {
    const safeName = escapeHtml(userName);
    const safeReportId = escapeHtml(reportId);
    const safeType = escapeHtml(reportType);
    const subject = "We have received your phishing report";

    const html = layout(`
      <h2 style="margin: 0 0 16px; font-size: 20px; line-height: 28px; color: ${BRAND.text};">Hi ${safeName},</h2>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: ${BRAND.text};">
        Thank you for helping keep our community safe. We have successfully received your suspicious <strong>${safeType}</strong> report.
      </p>
      <p style="margin: 0 0 24px; font-size: 15px; line-height: 24px; color: ${BRAND.text};">
        Our system and security analysts will review the submission shortly. You can track the status of your report using the ID below.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; border: 1px solid #eeeeee; border-radius: 4px; overflow: hidden;">
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eeeeee; width: 35%; background-color: #fbfbfb;">
            <strong style="color: ${BRAND.muted}; font-size: 13px;">Report ID</strong>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eeeeee; color: ${BRAND.text}; font-size: 13px; font-family: 'Courier New', Courier, monospace;">
            ${safeReportId}
          </td>
        </tr>
      </table>
      ${ctaButton(`${frontendUrl}/reports/${reportId}`, "View Report Status")}
    `);

    const text = [
      `Hi ${userName},`,
      "",
      `Thank you for helping keep our community safe. We have successfully received your suspicious ${reportType} report.`,
      "",
      `Report ID: ${reportId}`,
      "",
      `Track report status: ${normalizeUrl(`${frontendUrl}/reports/${reportId}`)}`,
    ].join("\n");

    return { subject, html, text };
  },

  newReportAlert({ adminName, reportId, reporterEmail, reportType, frontendUrl }) {
    const safeName = escapeHtml(adminName);
    const safeReportId = escapeHtml(reportId);
    const safeEmail = escapeHtml(reporterEmail);
    const safeType = escapeHtml(reportType);
    const subject = "New Phishing Report Requires Review";

    const html = layout(`
      <h2 style="margin: 0 0 16px; font-size: 20px; line-height: 28px; color: ${BRAND.text};">Hi ${safeName},</h2>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: ${BRAND.text};">
        A new suspicious <strong>${safeType}</strong> has been reported by a user and requires analyst review.
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px; border: 1px solid #eeeeee; border-radius: 4px; overflow: hidden;">
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eeeeee; width: 35%; background-color: #fbfbfb;">
            <strong style="color: ${BRAND.muted}; font-size: 13px;">Reporter</strong>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #eeeeee; color: ${BRAND.text}; font-size: 13px;">
            ${safeEmail}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; background-color: #fbfbfb;">
            <strong style="color: ${BRAND.muted}; font-size: 13px;">Report ID</strong>
          </td>
          <td style="padding: 12px 16px; color: ${BRAND.text}; font-size: 13px; font-family: 'Courier New', Courier, monospace;">
            ${safeReportId}
          </td>
        </tr>
      </table>
      ${ctaButton(`${frontendUrl}/admin/reports/${reportId}`, "Review Report")}
    `);

    const text = [
      `Hi ${adminName},`,
      "",
      `A new suspicious ${reportType} has been reported by ${reporterEmail}.`,
      "",
      `Report ID: ${reportId}`,
      "",
      `Review report: ${normalizeUrl(`${frontendUrl}/admin/reports/${reportId}`)}`,
    ].join("\n");

    return { subject, html, text };
  }
};

module.exports = emailTemplates;
