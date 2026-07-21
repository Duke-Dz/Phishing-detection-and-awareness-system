const test = require("node:test");
const assert = require("node:assert/strict");

const {
  decodeEncodedWords,
  decodeQuotedPrintable,
  extractAuthHeaders,
  extractHtmlNavigationUrls,
  extractHttpUrls,
  htmlToVisibleText,
  normalizeVisibleText,
  parseHeaderBlock,
  parseRawEmail,
} = require("../../src/utils/emailParser");

test("decodes RFC 2047 encoded words and safely unfolds duplicate headers", () => {
  const parsed = parseHeaderBlock([
    "Subject: =?UTF-8?Q?Quarterly?= =?UTF-8?Q?_Update_=E2=9C=93?=",
    "Received: from first.example",
    "Received: from second.example",
    "\tby mx.example",
  ].join("\r\n"));

  assert.equal(parsed.headers.subject, "Quarterly Update ✓");
  assert.deepEqual(parsed.headerValues.received, [
    "from first.example",
    "from second.example by mx.example",
  ]);
  assert.equal(
    parsed.headers.received,
    "from first.example; from second.example by mx.example",
  );
  assert.equal(decodeEncodedWords("=?ISO-8859-1?Q?Andr=E9?="), "André");
});

test("recursively decodes multipart content, URLs, and attachment metadata", () => {
  const html = [
    "<html><body>",
    "<p>Hello José</p>",
    '<a href="https://example.com/path?x=1">Review</a>',
    '<img src="https://cdn.example.net/pixel.png">',
    "</body></html>",
  ].join("");
  const attachment = Buffer.from("%PDF-1.4\n", "ascii");
  const raw = [
    "From: Example Sender <sender@example.com>",
    "To: recipient@example.net",
    "Subject: =?UTF-8?B?UXVhcnRlcmx5IFJlcG9ydCDinJM=?=",
    "MIME-Version: 1.0",
    'Content-Type: multipart/mixed; boundary="outer-boundary"',
    "",
    "--outer-boundary",
    'Content-Type: multipart/alternative; boundary="inner-boundary"',
    "",
    "--inner-boundary",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    "Hello Jos=C3=A9",
    "Review https://example.com/path?x=1.",
    "--inner-boundary",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html, "utf8").toString("base64"),
    "--inner-boundary--",
    "--outer-boundary",
    "Content-Type: application/pdf; name=report.pdf",
    "Content-Disposition: attachment; filename*=UTF-8''Quarterly%20Report.pdf",
    "Content-Transfer-Encoding: base64",
    "",
    attachment.toString("base64"),
    "--outer-boundary--",
    "",
  ].join("\r\n");

  const result = parseRawEmail(raw);

  assert.equal(result.isRawEmail, true);
  assert.equal(result.subject, "Quarterly Report ✓");
  assert.match(result.body, /Hello José/);
  assert.match(result.htmlBody, /<p>Hello José<\/p>/);
  assert.equal(result.text, "Hello José\nReview https://example.com/path?x=1.");
  assert.equal(result.normalizedText, result.text);
  assert.deepEqual(result.urls, [
    "https://example.com/path?x=1",
  ]);
  assert.deepEqual(result.attachments, [{
    filename: "Quarterly Report.pdf",
    contentType: "application/pdf",
    disposition: "attachment",
    transferEncoding: "base64",
    contentId: null,
    size: attachment.length,
    inline: false,
  }]);
});

test("decodes single-part base64 and quoted-printable text", () => {
  const base64Raw = [
    "From: sender@example.com",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from("A base64 message ✓", "utf8").toString("base64"),
  ].join("\n");

  assert.equal(parseRawEmail(base64Raw).body, "A base64 message ✓");
  assert.equal(
    decodeQuotedPrintable("Line one=\r\ncontinues =E2=9C=93", "utf-8"),
    "Line onecontinues ✓",
  );

  const latin1Raw = [
    "From: sender@example.com",
    "Content-Type: text/plain; charset=iso-8859-1",
    "",
    "André",
  ].join("\r\n");
  assert.equal(parseRawEmail(latin1Raw).body, "André");
});

test("extracts visible HTML text without script content and deduplicates URLs", () => {
  const html = [
    "<style>.hidden { display:none }</style>",
    "<script>steal('https://script.invalid')</script>",
    "<p>Open &amp; review</p>",
    '<a href="https://example.org/a">first</a>',
    '<a href="https://example.org/a">second</a>',
  ].join("");

  assert.equal(normalizeVisibleText(htmlToVisibleText(html)), "Open & review\nfirst second");
  assert.deepEqual(extractHttpUrls(html), [
    "https://script.invalid",
    "https://example.org/a",
  ]);
});

test("plain text is not misclassified as raw email", () => {
  const input = "Reminder: review https://example.com/update\nNo RFC 5322 envelope here.";
  const result = parseRawEmail(input);

  assert.equal(result.isRawEmail, false);
  assert.equal(result.body, input);
  assert.equal(result.subject, "");
  assert.deepEqual(result.headers, {});
  assert.deepEqual(result.urls, ["https://example.com/update"]);
});

test("header-like pasted text without a blank separator retains its body", () => {
  const input = [
    "From: PayPal Security <notice@example.com>",
    "Subject: Account review",
    "Immediately verify your password at https://example.com/login.",
  ].join("\n");
  const result = parseRawEmail(input);

  assert.equal(result.isRawEmail, false);
  assert.equal(result.body, input);
  assert.match(result.normalizedText, /Immediately verify your password/);
  assert.deepEqual(result.urls, ["https://example.com/login"]);
});

test("HTML navigation URLs exclude scripts, styles, and tracking resources", () => {
  const resources = Array.from(
    { length: 12 },
    (_value, index) => `<img src="https://track${index}.example/pixel.gif">`,
  ).join("");
  const html = [
    "<style>@import url(https://styles.example/site.css)</style>",
    "<script>fetch('https://scripts.example/collect')</script>",
    resources,
    '<a href="https://malicious.example/login?next=%2Faccount&amp;source=email">Review</a>',
    '<a href="https&colon;&sol;&sol;entity.example/login">Encoded link</a>',
    '<a href="h&Tab;ttps&colon;&sol;&sol;control.example/login">Control-obfuscated link</a>',
    "<p>Support: https://visible.example/help</p>",
  ].join("");

  assert.deepEqual(extractHtmlNavigationUrls(html), [
    "https://malicious.example/login?next=%2Faccount&source=email",
    "https://entity.example/login",
    "https://control.example/login",
    "https://visible.example/help",
  ]);

  const raw = [
    "From: sender@example.com",
    "Content-Type: text/html; charset=utf-8",
    "",
    html,
  ].join("\r\n");
  assert.deepEqual(parseRawEmail(raw).urls, [
    "https://malicious.example/login?next=%2Faccount&source=email",
    "https://entity.example/login",
    "https://control.example/login",
    "https://visible.example/help",
  ]);
});

test("Buffer input preserves unencoded ISO-8859-1 and Windows-1252 bytes", () => {
  const latin1 = Buffer.concat([
    Buffer.from([
      "From: sender@example.com",
      "Content-Type: text/plain; charset=iso-8859-1",
      "Content-Transfer-Encoding: 8bit",
      "",
      "Andr",
    ].join("\r\n"), "ascii"),
    Buffer.from([0xe9]),
  ]);
  assert.equal(parseRawEmail(latin1).body, "Andr\u00e9");

  const windows1252 = Buffer.concat([
    Buffer.from([
      "From: sender@example.com",
      "Content-Type: text/plain; charset=windows-1252",
      "Content-Transfer-Encoding: 8bit",
      "",
      "",
    ].join("\r\n"), "ascii"),
    Buffer.from([0x93]),
    Buffer.from("Price ", "ascii"),
    Buffer.from([0x80, 0x94]),
  ]);
  assert.equal(parseRawEmail(windows1252).body, "\u201cPrice \u20ac\u201d");
});

test("authentication parsing distinguishes absent and explicit unknown results", () => {
  assert.deepEqual(extractAuthHeaders({}), {
    spf: null,
    dkim: null,
    dmarc: null,
  });

  assert.deepEqual(extractAuthHeaders({
    "authentication-results": "mx.example; spf=unexpected; dkim=none; dmarc=temperror",
  }), {
    spf: "unknown",
    dkim: "none",
    dmarc: "temperror",
  });

  assert.equal(extractAuthHeaders({ "received-spf": "softfail (example)" }).spf, "softfail");
  assert.deepEqual(extractAuthHeaders(null), {
    spf: null,
    dkim: null,
    dmarc: null,
  });
});
