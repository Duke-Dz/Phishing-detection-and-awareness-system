const test = require("node:test");
const assert = require("node:assert/strict");
const { createAgent, createUserToken } = require("./helpers/setup");
const { analyzeMessage } = require("../../src/services/detectionService");

test("calibrated email detection regressions", async (t) => {
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

  await t.test("ordinary URLs and generic words remain safe", async () => {
    const result = await scan([
      "From: Product Team <news@example.com>",
      "Subject: Transfer and settings update",
      "Content-Type: text/plain; charset=utf-8",
      "",
      "Read the transfer and product update at https://example.com/news.",
    ].join("\r\n"));

    assert.equal(result.classification, "safe");
    assert.ok(result.risk_score <= 30);
  });

  await t.test("gift-card code business-email compromise is phishing", async () => {
    const result = await scan([
      'From: "Chief Executive" <chief@external.example>',
      "Subject: Confidential request - act now",
      "",
      "Buy ten gift cards immediately and send the scratched codes to me.",
    ].join("\r\n"));

    assert.equal(result.classification, "phishing");
    assert.equal(result.detection_details.layers.rules.signals.some(
      (signal) => signal.name === "gift_card_code_request",
    ), true);
  });

  await t.test("explicit macro-enabling attachment instruction is phishing", async () => {
    const result = await scan([
      "From: Billing <billing@unknown.example>",
      "MIME-Version: 1.0",
      'Content-Type: multipart/mixed; boundary="mixed"',
      "Subject: Overdue invoice",
      "",
      "--mixed",
      "Content-Type: text/plain; charset=utf-8",
      "",
      "Open the attached invoice and enable macros to view it.",
      "--mixed",
      'Content-Type: application/octet-stream; name="invoice.xlsm"',
      'Content-Disposition: attachment; filename="invoice.xlsm"',
      "Content-Transfer-Encoding: base64",
      "",
      "VEVTVA==",
      "--mixed--",
    ].join("\r\n"));

    assert.equal(result.classification, "phishing");
    assert.ok(result.risk_score >= 61);
  });

  await t.test("linked subscription renewal threat with data deletion is phishing", async () => {
    const result = await scan([
      "From: Cloud Secure <no-reply@unrelated.example>",
      "Subject: Your photos and videos will be deleted today",
      "Content-Type: text/html; charset=utf-8",
      "",
      "<p>Your cloud storage account is locked and your files will be deleted today.</p>",
      '<a href="https://storage.googleapis.com/untrusted-bucket/renew.html">Upgrade storage and renew your subscription</a>',
    ].join("\r\n"));

    assert.equal(result.classification, "phishing");
    assert.equal(result.detection_details.layers.rules.signals.some(
      (signal) => signal.name === "account_deletion_renewal_threat",
    ), true);
  });

  await t.test("regional names and SHA text are neutral", async () => {
    const result = await scan([
      "From: Newsletter <news@example.com>",
      "Subject: Public service roundup",
      "",
      "NHIF, KRA, KCB and SHA-256 are discussed in this weekly update.",
    ].join("\r\n"));

    assert.equal(result.classification, "safe");
    const evidence = result.detection_details.scoring.top_evidence || [];
    assert.equal(evidence.some((item) => /kenya|nhif|kra|kcb/i.test(item.name)), false);
  });

  await t.test("confirmed malicious URL cannot be averaged down", async () => {
    const result = await scan([
      "From: Newsletter <news@example.com>",
      "Authentication-Results: mx.google.com; spf=pass; dkim=pass; dmarc=pass",
      "Subject: Weekly news",
      "",
      "Read https://paypa1-secure.com/info",
    ].join("\r\n"));

    assert.equal(result.classification, "phishing");
    assert.ok(result.risk_score >= 70);
  });

  await t.test("brand mismatch plus credential action and typosquat is phishing", async () => {
    const result = await scan([
      "From: PayPal Security <alert@attacker.example>",
      "Subject: Urgent account notice",
      "",
      "Immediately verify your account. Enter your password at https://paypa1-support.com/login.",
    ].join("\r\n"));

    assert.equal(result.classification, "phishing");
    assert.ok(result.risk_score >= 61);
  });

  await t.test("uploaded authentication headers are untrusted", async () => {
    const content = [
      "From: Google Security <alert@google.com>",
      "Authentication-Results: mx.google.com; spf=fail; dkim=fail; dmarc=fail",
      "Content-Type: text/html; charset=utf-8",
      "Subject: Security notice",
      "",
      '<a href="https://evil.example/login">google.com/security</a>',
    ].join("\r\n");
    const uploaded = await scan(content);

    assert.equal(uploaded.detection_details.message_analysis.authentication.trusted, false);
    assert.ok(uploaded.risk_score <= 60);

    const trustedIngress = await analyzeMessage(content, "email", {
      trustedAuthentication: {
        authserv_id: "mx.google.com",
        spf: "fail",
        dkim: "fail",
        dmarc: "fail",
      },
    });
    assert.equal(trustedIngress.detection_details.message_analysis.authentication.trusted, true);
    assert.equal(trustedIngress.classification, "phishing");
    assert.ok(trustedIngress.risk_score >= 61);
  });

  await t.test("byte-preserving uploads decode declared legacy charsets", async () => {
    const rawBytes = Buffer.concat([
      Buffer.from([
        "From: Billing <billing@example.com>",
        "Subject: Receipt",
        "Content-Type: text/plain; charset=windows-1252",
        "Content-Transfer-Encoding: 8bit",
        "",
        "Price ",
      ].join("\r\n"), "ascii"),
      Buffer.from([0x80]),
    ]);
    const result = await scan(`data:message/rfc822;base64,${rawBytes.toString("base64")}`);

    assert.equal(result.detection_details.message_analysis.input_mode, "rfc5322_bytes");
    assert.match(result.target, /Price €/);
    assert.equal(result.classification, "safe");
  });

  await t.test("URL analysis keeps distinct paths and covers links beyond eight", async () => {
    const sameHost = await scan([
      "From: Newsletter <news@example.com>",
      "Subject: Links",
      "",
      "https://example.com/news/a https://example.com/news/b",
    ].join("\r\n"));
    const sameHostUrls = sameHost.detection_details.embedded_urls.map((item) => item.url);
    assert.deepEqual(sameHostUrls.sort(), [
      "https://example.com/news/a",
      "https://example.com/news/b",
    ]);

    const ordinary = Array.from({ length: 8 }, (_value, index) => `https://example${index}.com/news`);
    const risky = "https://paypa1-secure.com/login";
    const prioritized = await scan([
      "From: Newsletter <news@example.com>",
      "Subject: Links",
      "",
      ...ordinary,
      risky,
    ].join("\r\n"));
    const analyzedUrls = prioritized.detection_details.embedded_urls.map((item) => item.url);
    assert.equal(analyzedUrls.length, 9);
    assert.equal(analyzedUrls.includes(risky), true);
  });

  await t.test("incomplete URL coverage abstains instead of returning safe", async () => {
    const links = Array.from(
      { length: 201 },
      (_value, index) => `https://example.com/news/${index}`,
    );
    const result = await scan([
      "From: Newsletter <news@example.com>",
      "Subject: Link archive",
      "",
      ...links,
    ].join("\r\n"));

    assert.equal(result.classification, "suspicious");
    assert.equal(result.detection_details.message_analysis.url_count, 201);
    assert.equal(result.detection_details.message_analysis.analyzed_url_count, 200);
    assert.equal(result.detection_details.layers.rules.signals.some(
      (signal) => signal.name === "url_analysis_incomplete",
    ), true);
  });

  await t.test("provider request limits abstain instead of failing open", async () => {
    const originalKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    const originalEnabled = process.env.GOOGLE_SAFE_BROWSING_ENABLED;
    process.env.GOOGLE_SAFE_BROWSING_API_KEY = "test-key";
    process.env.GOOGLE_SAFE_BROWSING_ENABLED = "true";
    try {
      const result = await scan([
        "From: Newsletter <news@example.com>",
        "Subject: Long destination",
        "",
        `https://oversized.example/${"a".repeat(8000)}`,
      ].join("\r\n"));

      assert.equal(result.classification, "suspicious");
      assert.equal(result.detection_details.layers.blacklist.signals.some(
        (signal) => signal.name === "reputation_coverage_failed",
      ), true);
    } finally {
      if (originalKey === undefined) delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
      else process.env.GOOGLE_SAFE_BROWSING_API_KEY = originalKey;
      if (originalEnabled === undefined) delete process.env.GOOGLE_SAFE_BROWSING_ENABLED;
      else process.env.GOOGLE_SAFE_BROWSING_ENABLED = originalEnabled;
    }
  });

  await t.test("executable attachment is decisive while a PDF is not", async () => {
    const executable = await scan([
      "From: Billing <billing@example.com>",
      "MIME-Version: 1.0",
      'Content-Type: multipart/mixed; boundary="mixed"',
      "Subject: Invoice",
      "",
      "--mixed",
      "Content-Type: text/plain; charset=utf-8",
      "",
      "Invoice attached.",
      "--mixed",
      'Content-Type: application/x-msdownload; name="invoice.pdf.exe"',
      'Content-Disposition: attachment; filename="invoice.pdf.exe"',
      "Content-Transfer-Encoding: base64",
      "",
      "TVo=",
      "--mixed--",
    ].join("\r\n"));

    assert.equal(executable.classification, "phishing");
    assert.ok(executable.risk_score >= 61);

    const pdf = await scan([
      "From: Billing <billing@example.com>",
      "MIME-Version: 1.0",
      'Content-Type: multipart/mixed; boundary="mixed"',
      "Subject: Invoice",
      "",
      "--mixed",
      "Content-Type: text/plain; charset=utf-8",
      "",
      "Invoice attached.",
      "--mixed",
      'Content-Type: application/pdf; name="invoice.pdf"',
      'Content-Disposition: attachment; filename="invoice.pdf"',
      "Content-Transfer-Encoding: base64",
      "",
      "JVBERg==",
      "--mixed--",
    ].join("\r\n"));

    assert.equal(pdf.classification, "safe");
    assert.ok(pdf.risk_score <= 30);
  });
});
