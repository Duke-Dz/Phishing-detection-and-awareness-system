const config = require("../config/env");
const { alert, button, details, greeting, layout, list, paragraph, safeUrl } = require("./components");

const formatDate = (value = new Date()) => new Date(value).toLocaleString("en-KE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Nairobi",
});

const result = ({ subject, title = subject, preheader, body, text, tone, essential = false }) => {
  const renderedHtml = layout({ title, preheader, body, tone });
  const html = essential
    ? renderedHtml.replace(
        /<span[^>]*>[^<]*<\/span><a href="\{\{UNSUBSCRIBE_URL\}\}"[^>]*>Unsubscribe from non-essential emails<\/a>/,
        "",
      )
    : renderedHtml;
  return {
    subject,
    html,
    text: [
      ...text.filter(Boolean),
      "",
      "CyberSense Security",
      `Support: ${config.mail.support}`,
      "Privacy policy: {{PRIVACY_URL}}",
      !essential && "Unsubscribe from non-essential emails: {{UNSUBSCRIBE_URL}}",
      "Account and critical security messages may still be sent when necessary.",
    ].filter(Boolean).join("\n"),
    essential,
  };
};

module.exports = {
  phishingAlert({
    userName, target, riskScore, classification, scanId, scanType = "url",
    scannedAt, detectedSignals = [], recommendations = [], frontendUrl = config.frontendUrl,
  }) {
    const score = Number(riskScore) || 0;
    const dangerous = classification === "phishing";
    const tone = dangerous ? "danger" : classification === "suspicious" ? "warning" : "success";
    const subject = dangerous
      ? `Action recommended: phishing detected (${score}/100)`
      : `CyberSense scan completed: ${classification}`;
    const actions = recommendations.length ? recommendations : dangerous
      ? [
          "Do not open links, attachments, or reply to the sender.",
          "If you already interacted, change affected passwords immediately.",
          "Contact the organization using a verified website or phone number.",
        ]
      : [
          "Verify unexpected requests through an independent, trusted channel.",
          "Remain alert for unusual follow-up messages or requests.",
        ];
    const body = greeting(userName) +
      paragraph(`CyberSense has completed the security analysis of your ${scanType.toUpperCase()} submission.`) +
      alert(`Assessment: ${classification.toUpperCase()} — risk score ${score}/100`, tone) +
      details([["Target", target], ["Scan ID", scanId], ["Scanned", formatDate(scannedAt)]]) +
      list(detectedSignals) +
      list(actions) +
      button(`${frontendUrl}/scan/${scanId}`, "Review security report");
    return result({
      subject,
      preheader: `CyberSense classified your ${scanType} submission as ${classification}.`,
      body,
      tone,
      text: [
        `Hello ${userName},`,
        `Assessment: ${classification}`,
        `Risk score: ${score}/100`,
        `Target: ${target}`,
        `Scan ID: ${scanId}`,
        ...actions,
        `Report: ${safeUrl(`${frontendUrl}/scan/${scanId}`)}`,
      ],
    });
  },

  emailVerification({ verificationUrl, userName }) {
    const subject = "Verify your email address for CyberSense";
    const body = greeting(userName) +
      paragraph("Thank you for creating a CyberSense account. Please confirm that this email address belongs to you to activate your account.") +
      button(verificationUrl, "Verify email address") +
      alert("For your security, this verification link expires automatically. If you did not create this account, no action is required.", "info");
    return result({
      subject,
      preheader: "Confirm your email address to activate your CyberSense account.",
      body,
      text: [
        `Hello ${userName},`,
        "Confirm your email address to activate your CyberSense account:",
        safeUrl(verificationUrl),
        "If you did not create this account, no action is required.",
      ],
      essential: true,
    });
  },

  passwordReset({
    resetUrl,
    userName,
    expiryMinutes = config.passwordResetTokenExpiryMinutes,
  }) {
    const subject = "Reset your CyberSense password";
    const body = greeting(userName) +
      paragraph("We received a request to reset the password for your CyberSense account. Use the secure link below to choose a new password.") +
      button(resetUrl, "Reset my password") +
      paragraph(`This secure link expires in ${expiryMinutes} minutes and can be used only once. Never share it with anyone.`) +
      paragraph("If you did not request this reset, you can safely ignore this email. Your password has not been changed.");
    return result({
      subject,
      preheader: `Your secure password-reset link expires in ${expiryMinutes} minutes.`,
      body,
      tone: "warning",
      text: [
        `Hello ${userName},`,
        `Use this secure link to reset your password. It expires in ${expiryMinutes} minutes:`,
        safeUrl(resetUrl),
        "Never share this reset link with anyone.",
        "If you did not request this, you can ignore this email. Your password has not been changed.",
      ],
      essential: true,
    });
  },

  passwordChanged({ userName }) {
    const subject = "CyberSense password changed successfully";
    const body = greeting(userName) +
      alert("The password for your CyberSense account was changed successfully.", "success") +
      paragraph("If you made this change, no further action is required. If you do not recognize this activity, reset your password immediately and contact CyberSense support.");
    return result({
      subject,
      preheader: "Your CyberSense account password has been updated.",
      body,
      tone: "success",
      text: [
        `Hello ${userName},`,
        "Your CyberSense password was changed successfully.",
        "If you do not recognize this activity, reset your password and contact support immediately.",
      ],
      essential: true,
    });
  },

  reportStatusUpdate({ userName, reportId, newStatus, notes, frontendUrl = config.frontendUrl }) {
    const readableStatus = newStatus.replace(/_/g, " ");
    const subject = `CyberSense report update: ${readableStatus}`;
    const body = greeting(userName) +
      paragraph("There is an update to a security report you submitted.") +
      details([["Report ID", reportId], ["Current status", readableStatus], ["Analyst notes", notes]]) +
      button(`${frontendUrl}/reports/${reportId}`, "View report details");
    return result({
      subject,
      preheader: `Your security report is now ${readableStatus}.`,
      body,
      text: [
        `Hello ${userName},`,
        `Report ID: ${reportId}`,
        `Current status: ${readableStatus}`,
        notes && `Analyst notes: ${notes}`,
        safeUrl(`${frontendUrl}/reports/${reportId}`),
      ],
    });
  },

  reportReceived({ userName, reportId, reportType, frontendUrl = config.frontendUrl }) {
    const subject = "CyberSense received your security report";
    const body = greeting(userName) +
      paragraph("Thank you for helping protect the community. Your report was received successfully and is available for review.") +
      alert("The report is queued for analyst review. We will notify you when its status changes.", "success") +
      details([["Report ID", reportId], ["Content type", reportType], ["Submitted", formatDate()]]) +
      button(`${frontendUrl}/reports/${reportId}`, "Track report status");
    return result({
      subject,
      preheader: "Your security report was received and queued for review.",
      body,
      tone: "success",
      text: [
        `Hello ${userName},`,
        "Your security report was received and queued for review.",
        `Report ID: ${reportId}`,
        safeUrl(`${frontendUrl}/reports/${reportId}`),
      ],
    });
  },

  newReportAlert({
    adminName, reportId, reporterEmail, reportType, riskScore, classification,
    frontendUrl = config.frontendUrl,
  }) {
    const subject = `Review required: new ${reportType} security report`;
    const body = greeting(adminName) +
      paragraph("A new user-submitted security report requires analyst review.") +
      alert(`Initial assessment: ${classification} — risk score ${riskScore}/100.`, "warning") +
      details([
        ["Report ID", reportId],
        ["Reporter", reporterEmail],
        ["Content type", reportType],
        ["Classification", classification],
      ]) +
      button(`${frontendUrl}/admin/reports/${reportId}`, "Open analyst review");
    return result({
      subject,
      preheader: `A new ${reportType} report requires analyst review.`,
      body,
      tone: "warning",
      text: [
        `Hello ${adminName},`,
        "A new security report requires review.",
        `Report ID: ${reportId}`,
        `Reporter: ${reporterEmail}`,
        `Risk score: ${riskScore}/100`,
        safeUrl(`${frontendUrl}/admin/reports/${reportId}`),
      ],
    });
  },

  accountLocked({ userName, lockoutMinutes, resetUrl }) {
    const subject = "Security alert: CyberSense account temporarily locked";
    const body = greeting(userName) +
      paragraph("CyberSense detected repeated unsuccessful sign-in attempts to your account.") +
      alert(`To protect your account, sign-in has been temporarily locked for ${lockoutMinutes} minutes.`, "danger") +
      paragraph("If these attempts were not yours, reset your password now and review your account activity.") +
      button(resetUrl, "Secure my account");
    return result({
      subject,
      preheader: "We temporarily locked your account after repeated sign-in attempts.",
      body,
      tone: "danger",
      text: [
        `Hello ${userName},`,
        `Your account is temporarily locked for ${lockoutMinutes} minutes after repeated sign-in attempts.`,
        "If this was not you, secure your account:",
        safeUrl(resetUrl),
      ],
      essential: true,
    });
  },

  newSignIn({ userName, ipAddress, userAgent, time, resetUrl }) {
    const subject = "Security notice: new CyberSense sign-in";
    const body = greeting(userName) +
      paragraph("A sign-in to your CyberSense account was recorded from a device or location we did not immediately recognize.") +
      details([["Date and time", formatDate(time)], ["IP address", ipAddress], ["Device", userAgent]]) +
      alert("If this was you, no action is required. If you do not recognize this sign-in, secure your account immediately.", "warning") +
      button(resetUrl, "Secure my account");
    return result({
      subject,
      preheader: "Review a new sign-in recorded on your CyberSense account.",
      body,
      tone: "warning",
      text: [
        `Hello ${userName},`,
        "A new sign-in was recorded.",
        `Time: ${formatDate(time)}`,
        `IP address: ${ipAddress}`,
        `Device: ${userAgent}`,
        "If this was not you, secure your account:",
        safeUrl(resetUrl),
      ],
      essential: true,
    });
  },
};
