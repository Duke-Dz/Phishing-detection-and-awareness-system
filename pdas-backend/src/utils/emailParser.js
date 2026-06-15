/**
 * @module emailParser
 * @description Parse raw RFC 5322 email text and extract structured data.
 *              Uses string splitting only — no external email parsing library.
 */

/**
 * Parse a raw email string (RFC 5322 format).
 * @param {string} rawText - The raw email text
 * @returns {{ from: string, to: string, subject: string, date: string, headers: object, body: string, htmlBody: string }}
 */
const parseRawEmail = (rawText) => {
  const text = String(rawText || "");

  // ── Split headers from body (separated by first blank line) ──
  const headerBodySplit = text.indexOf("\r\n\r\n") !== -1
    ? text.indexOf("\r\n\r\n")
    : text.indexOf("\n\n");

  const headerSection = headerBodySplit !== -1
    ? text.slice(0, headerBodySplit)
    : text;
  const bodySection = headerBodySplit !== -1
    ? text.slice(headerBodySplit).replace(/^(\r?\n){2}/, "")
    : "";

  // ── Parse headers (handle folded/continuation lines) ──
  const headers = {};
  const headerLines = headerSection.split(/\r?\n/);
  let currentKey = null;

  for (const line of headerLines) {
    // Continuation line (starts with whitespace)
    if (/^\s+/.test(line) && currentKey) {
      headers[currentKey] += " " + line.trim();
      continue;
    }

    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      currentKey = line.slice(0, colonIndex).trim().toLowerCase();
      const value = line.slice(colonIndex + 1).trim();

      // Accumulate duplicate headers (e.g. multiple Received)
      if (headers[currentKey]) {
        headers[currentKey] += "; " + value;
      } else {
        headers[currentKey] = value;
      }
    }
  }

  // ── Extract common header fields ──
  const from = headers["from"] || "";
  const to = headers["to"] || "";
  const subject = headers["subject"] || "";
  const date = headers["date"] || "";

  // ── Parse body (handle MIME multipart) ──
  let body = "";
  let htmlBody = "";

  const contentType = headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary\s*=\s*"?([^";\s]+)"?/i);

  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = bodySection.split(new RegExp(`--${escapeRegex(boundary)}`));

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed || trimmed === "--") continue;

      // Split part headers from part body
      const partSplitIndex = trimmed.indexOf("\r\n\r\n") !== -1
        ? trimmed.indexOf("\r\n\r\n")
        : trimmed.indexOf("\n\n");

      if (partSplitIndex === -1) continue;

      const partHeaders = trimmed.slice(0, partSplitIndex).toLowerCase();
      const partBody = trimmed.slice(partSplitIndex).replace(/^(\r?\n){2}/, "").trim();

      if (partHeaders.includes("text/html") && !htmlBody) {
        htmlBody = partBody;
      } else if (partHeaders.includes("text/plain") && !body) {
        body = partBody;
      }
    }
  } else {
    // Single-part email
    if (contentType.includes("text/html")) {
      htmlBody = bodySection;
    } else {
      body = bodySection;
    }
  }

  return { from, to, subject, date, headers, body, htmlBody };
};

/**
 * Extract SPF, DKIM, and DMARC results from parsed headers.
 * @param {object} headers - Parsed headers object (lowercase keys)
 * @returns {{ spf: string|null, dkim: string|null, dmarc: string|null }}
 */
const extractAuthHeaders = (headers) => {
  const authResults = headers["authentication-results"] || "";
  const receivedSpf = headers["received-spf"] || "";

  const result = { spf: null, dkim: null, dmarc: null };

  // ── SPF ──
  const spfMatch = authResults.match(/spf\s*=\s*(\w+)/i)
    || receivedSpf.match(/^(\w+)/i);
  if (spfMatch) {
    result.spf = spfMatch[1].toLowerCase();
  }

  // ── DKIM ──
  const dkimMatch = authResults.match(/dkim\s*=\s*(\w+)/i);
  if (dkimMatch) {
    result.dkim = dkimMatch[1].toLowerCase();
  }

  // ── DMARC ──
  const dmarcMatch = authResults.match(/dmarc\s*=\s*(\w+)/i);
  if (dmarcMatch) {
    result.dmarc = dmarcMatch[1].toLowerCase();
  }

  return result;
};

/**
 * Escape special regex characters in a string.
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = { parseRawEmail, extractAuthHeaders };
