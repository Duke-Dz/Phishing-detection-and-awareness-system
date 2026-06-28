const test = require("node:test");
const assert = require("node:assert/strict");
const { generateUserGuide } = require("../../src/utils/userGuideGenerator");

test("generateUserGuide returns appropriate guide for safe URL", () => {
  const result = generateUserGuide("url", "safe", 10, {});
  assert.equal(result.title, "Link appears safe");
  assert.equal(result.summary.includes("did not detect"), true);
  assert.equal(result.actions.length > 0, true);
  assert.equal(result.redFlags.length, 0);
});

test("generateUserGuide returns appropriate guide for phishing URL", () => {
  const details = {
    is_blacklisted: true,
    threat_type: "malware",
    rules_matched: ["IP Address in URL", "Suspicious TLD"],
    has_credential_harvester: true
  };
  const result = generateUserGuide("url", "phishing", 95, details);
  
  assert.equal(result.title, "High Risk: Phishing or Malware Detected");
  assert.equal(result.summary.includes("strong indicators of malicious activity"), true);
  assert.equal(result.redFlags.length >= 3, true); 
  // It should include blacklist, rules, and credential harvester flags
  assert.ok(result.redFlags.some(flag => flag.includes("blacklisted")));
  assert.ok(result.redFlags.some(flag => flag.includes("IP Address in URL")));
  assert.ok(result.redFlags.some(flag => flag.includes("credential harvester")));
  
  assert.ok(result.actions.length > 0);
});

test("generateUserGuide handles SMS scans", () => {
  const details = {
    sms_scam_type: "M-Pesa scam",
    sms_red_flags: ["Urgent language", "Requests money"]
  };
  const result = generateUserGuide("sms", "suspicious", 60, details);
  
  assert.equal(result.title, "Suspicious Message");
  assert.equal(result.redFlags.length, 2);
  assert.equal(result.redFlags[0], "Urgent language");
  assert.ok(result.actions.some(action => action.toLowerCase().includes("reply")));
});

test("generateUserGuide handles Email scans", () => {
  const details = {
    auth_failures: ["SPF check failed"],
    rules_matched: ["Urgent Subject"]
  };
  const result = generateUserGuide("email", "suspicious", 75, details);
  
  assert.equal(result.title, "Suspicious Message");
  assert.ok(result.redFlags.some(flag => flag.includes("SPF check failed")));
  assert.ok(result.redFlags.some(flag => flag.includes("Urgent Subject")));
});
