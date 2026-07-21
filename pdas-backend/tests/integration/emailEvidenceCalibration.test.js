const test = require("node:test");
const assert = require("node:assert/strict");
const { checkDisplayNameSpoofing } = require("../../src/services/emailAuthService");
const { createAgent, createUserToken } = require("./helpers/setup");

test("correlated email evidence stays calibrated", async (t) => {
  const agent = await createAgent();
  const token = createUserToken();

  t.after(async () => {
    await agent.close();
  });

  const scan = async (content) => {
    const response = await agent.post("/api/email/analyze", {
      headers: { Authorization: `Bearer ${token}` },
      body: { content },
    });
    assert.equal(response.status, 201, JSON.stringify(response.body));
    return response.body.data;
  };

  await t.test("legitimate password reset with an official link remains low risk", async () => {
    const result = await scan([
      "From: Microsoft Account <account-security-noreply@accountprotection.microsoft.com>",
      "Subject: Reset your Microsoft account password",
      "Content-Type: text/plain; charset=utf-8",
      "",
      "Reset your password using https://account.live.com/password/reset. If you did not request this, ignore this email.",
    ].join("\r\n"));

    assert.equal(result.classification, "safe");
    assert.ok(result.risk_score <= 30);
    const contextual = result.detection_details.layers.ml.signals;
    assert.equal(contextual.some((signal) => signal.name === "context_credentialRequest"), true);
    assert.equal(contextual.some((signal) => signal.name === "context_credentialRequestWithUrl"), true);
    assert.deepEqual(
      [...new Set(contextual.filter((signal) => signal.name.startsWith("context_credentialRequest")).map((signal) => signal.family))],
      ["credential_action"],
    );
  });

  await t.test("ordinary MFA instructions without a link remain safe", async () => {
    const result = await scan([
      "From: Microsoft Account <account-security-noreply@accountprotection.microsoft.com>",
      "Subject: Complete sign-in",
      "",
      "Enter the security code shown by Microsoft Authenticator to finish signing in. Never share this code with anyone.",
    ].join("\r\n"));

    assert.equal(result.classification, "safe");
    assert.ok(result.risk_score <= 30);
  });

  await t.test("DHL regional sender domains are recognized", async () => {
    const spoofCheck = checkDisplayNameSpoofing("DHL Alerts <alerts@dhl.de>");
    assert.equal(spoofCheck.isSpoofed, false);

    const result = await scan([
      "From: DHL Alerts <alerts@dhl.de>",
      "Subject: Your shipment is on its way",
      "",
      "Track delivery updates at https://www.dhl.de/de/privatkunden.html.",
    ].join("\r\n"));

    assert.equal(result.classification, "safe");
    assert.ok(result.risk_score <= 30);
    assert.equal(
      result.detection_details.layers.rules.signals.some((signal) => signal.name === "display_name_domain_mismatch"),
      false,
    );
  });
});
