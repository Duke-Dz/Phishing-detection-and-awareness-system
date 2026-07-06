const test = require("node:test");
const assert = require("node:assert/strict");
const templates = require("../../src/templates/emailTemplates");

const fixtures = {
  phishingAlert: { userName: "<Admin>", target: "https://example.com?a=<x>", riskScore: 90, classification: "phishing", scanId: "scan-1", detectedSignals: ["Urgency"], frontendUrl: "https://app.example.com" },
  emailVerification: { userName: "User", verificationUrl: "https://app.example.com/verify" },
  passwordReset: { userName: "User", resetUrl: "https://app.example.com/reset" },
  passwordChanged: { userName: "User" },
  reportStatusUpdate: { userName: "User", reportId: "report-1", newStatus: "under_review", frontendUrl: "https://app.example.com" },
  reportReceived: { userName: "User", reportId: "report-1", reportType: "sms", frontendUrl: "https://app.example.com" },
  newReportAlert: { adminName: "Admin", reportId: "report-1", reporterEmail: "u@example.com", reportType: "sms", riskScore: 70, classification: "suspicious", frontendUrl: "https://app.example.com" },
  accountLocked: { userName: "User", lockoutMinutes: 15, resetUrl: "https://app.example.com/reset" },
  newSignIn: { userName: "User", ipAddress: "127.0.0.1", userAgent: "Browser", time: new Date("2026-01-01T00:00:00Z"), resetUrl: "https://app.example.com/reset" },
};

const essentialTemplates = new Set([
  "emailVerification",
  "passwordReset",
  "passwordChanged",
  "accountLocked",
  "newSignIn",
]);

for (const [name, input] of Object.entries(fixtures)) {
  test(`${name} returns complete email content`, () => {
    const output = templates[name](input);
    assert.ok(output.subject);
    assert.match(output.html, /<!doctype html>/i);
    assert.ok(output.text.length > 10);
    assert.doesNotMatch(output.html, /<Admin>/);
    assert.match(output.html, /\{\{PRIVACY_URL\}\}/);
    if (essentialTemplates.has(name)) {
      assert.equal(output.essential, true);
      assert.doesNotMatch(output.html, /\{\{UNSUBSCRIBE_URL\}\}/);
      assert.doesNotMatch(output.text, /\{\{UNSUBSCRIBE_URL\}\}/);
    } else {
      assert.equal(output.essential, false);
      assert.match(output.html, /\{\{UNSUBSCRIBE_URL\}\}/);
      assert.match(output.text, /\{\{UNSUBSCRIBE_URL\}\}/);
    }
    assert.match(output.html, /src="cid:cybersense-logo"/);
    assert.match(output.html, /alt="CyberSense"/);
    assert.match(output.html, /text-align:center/);
    assert.doesNotMatch(output.html, /Phishing detection and security awareness/i);
  });
}

test("password reset is concise and avoids unreliable request metadata", () => {
  const output = templates.passwordReset({
    userName: "User",
    resetUrl: "https://app.example.com/reset-password#token=test",
  });
  assert.doesNotMatch(output.html, /copy and paste/i);
  assert.doesNotMatch(output.html, />IP address<|>Device</i);
  assert.doesNotMatch(output.html, /border-left:4px/i);
  assert.match(output.html, /expires in 60 minutes/i);
  assert.match(output.html, /password has not been changed/i);
  assert.match(output.text, /Never share this reset link/i);
  assert.doesNotMatch(output.html, /reset-password\?token=/i);
});

test("email verification mentions expiry and supports fragment token links", () => {
  const output = templates.emailVerification({
    userName: "User",
    verificationUrl: "https://app.example.com/verify-email#token=test",
  });

  assert.match(output.html, /expires in 2 hours/i);
  assert.match(output.html, /verify-email#token=test/i);
  assert.doesNotMatch(output.html, /verify-email\?token=/i);
});

test("unsafe action URLs are not rendered", () => {
  const output = templates.emailVerification({ userName: "User", verificationUrl: "javascript:alert(1)" });
  assert.doesNotMatch(output.html, /javascript:/i);
  assert.match(output.html, /href="#"/);
});
