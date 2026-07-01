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

for (const [name, input] of Object.entries(fixtures)) {
  test(`${name} returns complete email content`, () => {
    const output = templates[name](input);
    assert.ok(output.subject);
    assert.match(output.html, /<!doctype html>/i);
    assert.ok(output.text.length > 10);
    assert.doesNotMatch(output.html, /<Admin>/);
    assert.match(output.html, /\{\{PRIVACY_URL\}\}/);
    assert.match(output.html, /\{\{UNSUBSCRIBE_URL\}\}/);
    assert.match(output.text, /\{\{UNSUBSCRIBE_URL\}\}/);
    assert.match(output.html, /src="cid:cybersense-logo"/);
    assert.match(output.html, /alt="CyberSense"/);
  });
}

test("unsafe action URLs are not rendered", () => {
  const output = templates.emailVerification({ userName: "User", verificationUrl: "javascript:alert(1)" });
  assert.doesNotMatch(output.html, /javascript:/i);
  assert.match(output.html, /href="#"/);
});
