/**
 * @module emailParser
 * @description RFC 5322/MIME preprocessing for uploaded email. It intentionally
 *              parses authentication results without treating untrusted header
 *              assertions as cryptographic verification.
 */

const { TextDecoder } = require("node:util");
const he = require("he");

const MAX_MIME_DEPTH = 20;
const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const RAW_EMAIL_HEADERS = new Set([
  "bcc",
  "cc",
  "content-disposition",
  "content-transfer-encoding",
  "content-type",
  "date",
  "delivery-date",
  "dkim-signature",
  "authentication-results",
  "arc-authentication-results",
  "arc-message-signature",
  "arc-seal",
  "from",
  "message-id",
  "mime-version",
  "received",
  "received-spf",
  "reply-to",
  "return-path",
  "sender",
  "subject",
  "to",
]);

const AUTH_STATUSES = {
  spf: new Set(["fail", "neutral", "none", "pass", "permerror", "softfail", "temperror"]),
  dkim: new Set(["fail", "neutral", "none", "pass", "permerror", "policy", "temperror"]),
  dmarc: new Set(["fail", "none", "pass", "permerror", "temperror"]),
};

/**
 * Find the first RFC 5322 header/body separator.
 * @param {string} text
 * @returns {{ index: number, length: number }}
 */
const findHeaderBodySeparator = (text) => {
  const match = /\r\n\r\n|\n\n|\r\r/.exec(text);
  return match
    ? { index: match.index, length: match[0].length }
    : { index: -1, length: 0 };
};

/**
 * Decode bytes using a MIME charset, falling back without throwing on unknown
 * or malformed charset labels.
 * @param {Buffer} buffer
 * @param {string} [charset]
 * @returns {string}
 */
const decodeBuffer = (buffer, charset = "utf-8") => {
  const label = String(charset || "utf-8")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .toLowerCase();

  const aliases = {
    ascii: "us-ascii",
    latin1: "windows-1252",
    "iso8859-1": "windows-1252",
    "iso_8859-1": "windows-1252",
    "utf8": "utf-8",
  };

  try {
    return new TextDecoder(aliases[label] || label, { fatal: false }).decode(buffer);
  } catch (_error) {
    return buffer.toString("utf8");
  }
};

const decodeUnlabelledBuffer = (buffer) => {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch (_error) {
    return decodeBuffer(buffer, "windows-1252");
  }
};

/**
 * Convert quoted-printable octets to a Buffer. Soft line breaks are removed.
 * @param {string} value
 * @returns {Buffer}
 */
const decodeQuotedPrintableBuffer = (value) => {
  const input = String(value || "").replace(/=\r\n|=\n|=\r/g, "");
  const bytes = [];

  for (let index = 0; index < input.length; index += 1) {
    if (input[index] === "=" && /^[0-9A-Fa-f]{2}$/.test(input.slice(index + 1, index + 3))) {
      bytes.push(Number.parseInt(input.slice(index + 1, index + 3), 16));
      index += 2;
      continue;
    }

    const codePoint = input.codePointAt(index);
    const character = String.fromCodePoint(codePoint);
    if (codePoint <= 0xff) {
      bytes.push(codePoint);
    } else {
      bytes.push(...Buffer.from(character, "utf8"));
    }
    if (character.length === 2) index += 1;
  }

  return Buffer.from(bytes);
};

/**
 * Decode quoted-printable text.
 * @param {string} value
 * @param {string} [charset]
 * @returns {string}
 */
const decodeQuotedPrintable = (value, charset = "utf-8") => (
  decodeBuffer(decodeQuotedPrintableBuffer(value), charset)
);

/**
 * Decode RFC 2047 encoded words in an unstructured header value.
 * @param {string} value
 * @returns {string}
 */
const decodeEncodedWords = (value) => {
  const input = String(value || "").replace(
    /(\?=)[ \t\r\n]+(?==\?)/g,
    "$1",
  );

  return input.replace(
    /=\?([^?\s]+)\?([bq])\?([^?]*)\?=/gi,
    (encodedWord, charset, encoding, payload) => {
      try {
        let bytes;
        if (encoding.toLowerCase() === "b") {
          const compact = payload.replace(/\s/g, "");
          if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact) || compact.length % 4 === 1) {
            return encodedWord;
          }
          bytes = Buffer.from(compact, "base64");
        } else {
          bytes = decodeQuotedPrintableBuffer(payload.replace(/_/g, " "));
        }
        return decodeBuffer(bytes, charset);
      } catch (_error) {
        return encodedWord;
      }
    },
  );
};

/**
 * Parse and unfold an RFC 5322-style header block. Duplicate values remain
 * available individually while the legacy string map is retained.
 * @param {string} section
 * @returns {{ headers: object, headerValues: Record<string, string[]> }}
 */
const parseHeaderBlock = (section) => {
  const values = new Map();
  let currentName = null;

  for (const line of String(section || "").split(/\r\n|\n|\r/)) {
    if (/^[ \t]/.test(line) && currentName) {
      const entries = values.get(currentName);
      entries[entries.length - 1] += ` ${line.trim()}`;
      continue;
    }

    const separator = line.indexOf(":");
    if (separator <= 0) {
      currentName = null;
      continue;
    }

    const name = line.slice(0, separator).trim().toLowerCase();
    if (!HEADER_NAME_PATTERN.test(name)) {
      currentName = null;
      continue;
    }

    currentName = name;
    const unfoldedValue = line
      .slice(separator + 1)
      .replace(/[\r\n]+/g, " ")
      .trim();
    if (!values.has(name)) values.set(name, []);
    values.get(name).push(unfoldedValue);
  }

  const headers = {};
  const headerValues = {};
  for (const [name, rawValues] of values.entries()) {
    const decodedValues = rawValues.map(decodeEncodedWords);
    Object.defineProperty(headerValues, name, {
      configurable: true,
      enumerable: true,
      value: decodedValues,
      writable: true,
    });
    Object.defineProperty(headers, name, {
      configurable: true,
      enumerable: true,
      value: decodedValues.join("; "),
      writable: true,
    });
  }

  return { headers, headerValues };
};

/**
 * Split a MIME structured header into its primary value and parameters.
 * Semicolons and escapes inside quoted strings are preserved.
 * @param {string} value
 * @returns {{ value: string, parameters: Record<string, string> }}
 */
const parseStructuredHeader = (value) => {
  const segments = [];
  let segment = "";
  let quoted = false;
  let escaped = false;

  for (const character of String(value || "")) {
    if (escaped) {
      segment += character;
      escaped = false;
      continue;
    }
    if (character === "\\" && quoted) {
      segment += character;
      escaped = true;
      continue;
    }
    if (character === "\"") {
      quoted = !quoted;
      segment += character;
      continue;
    }
    if (character === ";" && !quoted) {
      segments.push(segment);
      segment = "";
      continue;
    }
    segment += character;
  }
  segments.push(segment);

  const primaryValue = (segments.shift() || "").trim().toLowerCase();
  const parameters = Object.create(null);

  for (const item of segments) {
    const equals = item.indexOf("=");
    if (equals <= 0) continue;
    const name = item.slice(0, equals).trim().toLowerCase();
    let parameterValue = item.slice(equals + 1).trim();
    if (parameterValue.startsWith("\"") && parameterValue.endsWith("\"")) {
      parameterValue = parameterValue
        .slice(1, -1)
        .replace(/\\([\\"])/g, "$1");
    }
    parameters[name] = parameterValue;
  }

  return { value: primaryValue, parameters };
};

/**
 * Decode an RFC 2231 percent-encoded parameter value.
 * @param {string} value
 * @returns {string}
 */
const decodeExtendedParameter = (value) => {
  const input = String(value || "");
  const match = /^([^']*)'[^']*'(.*)$/.exec(input);
  const charset = match ? match[1] || "utf-8" : "utf-8";
  const encoded = match ? match[2] : input;
  const bytes = [];

  for (let index = 0; index < encoded.length; index += 1) {
    if (encoded[index] === "%" && /^[0-9A-Fa-f]{2}$/.test(encoded.slice(index + 1, index + 3))) {
      bytes.push(Number.parseInt(encoded.slice(index + 1, index + 3), 16));
      index += 2;
    } else {
      bytes.push(...Buffer.from(encoded[index], "utf8"));
    }
  }

  return decodeBuffer(Buffer.from(bytes), charset);
};

/**
 * Resolve normal, extended, and continued MIME parameters.
 * @param {Record<string, string>} parameters
 * @param {string} name
 * @returns {string}
 */
const getMimeParameter = (parameters, name) => {
  const key = name.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(parameters, `${key}*`)) {
    return decodeExtendedParameter(parameters[`${key}*`]);
  }

  const continuations = Object.entries(parameters)
    .map(([parameterName, value]) => {
      const match = new RegExp(`^${escapeRegex(key)}\\*(\\d+)(\\*)?$`, "i").exec(parameterName);
      return match
        ? { index: Number.parseInt(match[1], 10), encoded: Boolean(match[2]), value }
        : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.index - right.index);

  if (continuations.length && continuations[0].index === 0) {
    const combined = continuations.map((item) => item.value).join("");
    return continuations.some((item) => item.encoded)
      ? decodeExtendedParameter(combined)
      : decodeEncodedWords(combined);
  }

  return decodeEncodedWords(parameters[key] || "");
};

/**
 * Decode an entity body to bytes according to Content-Transfer-Encoding.
 * @param {string} body
 * @param {string} transferEncoding
 * @param {string} [charset]
 * @param {boolean} [binarySource] Whether body characters are a one-to-one
 * byte mapping created from an input Buffer.
 * @returns {Buffer}
 */
const decodeTransferBuffer = (body, transferEncoding, charset = "", binarySource = false) => {
  const encoding = String(transferEncoding || "7bit").trim().toLowerCase();
  if (encoding === "base64") {
    const compact = String(body || "").replace(/\s/g, "");
    if (/^[A-Za-z0-9+/]*={0,2}$/.test(compact) && compact.length % 4 !== 1) {
      return Buffer.from(compact, "base64");
    }
  }
  if (encoding === "quoted-printable") {
    return decodeQuotedPrintableBuffer(body);
  }
  if (binarySource && !/[^\u0000-\u00ff]/.test(String(body || ""))) {
    return Buffer.from(String(body || ""), "latin1");
  }
  const normalizedCharset = String(charset || "").toLowerCase();
  if (/^(?:iso-8859-1|iso8859-1|iso_8859-1|latin1|windows-1252|cp1252)$/.test(normalizedCharset)
    && !/[^\u0000-\u00ff]/.test(String(body || ""))) {
    return Buffer.from(String(body || ""), "latin1");
  }
  return Buffer.from(String(body || ""), "utf8");
};

/**
 * Split a multipart entity on delimiter lines without interpreting boundary
 * text that merely occurs inside content.
 * @param {string} body
 * @param {string} boundary
 * @returns {string[]}
 */
const splitMultipartBody = (body, boundary) => {
  if (!boundary) return [];
  const opening = `--${boundary}`;
  const closing = `--${boundary}--`;
  const parts = [];
  let active = false;
  let lines = [];

  for (const line of String(body || "").split(/\r\n|\n|\r/)) {
    const marker = line.replace(/[ \t]+$/g, "");
    if (marker === opening || marker === closing) {
      if (active) parts.push(lines.join("\r\n"));
      lines = [];
      active = marker !== closing;
      if (marker === closing) break;
      continue;
    }
    if (active) lines.push(line);
  }

  if (active && lines.length) parts.push(lines.join("\r\n"));
  return parts;
};

/**
 * Decode HTML5 named and numeric character references.
 * @param {string} value
 * @param {{ isAttributeValue?: boolean }} [options]
 * @returns {string}
 */
const decodeHtmlEntities = (value, options = {}) => he.decode(
  String(value || ""),
  { isAttributeValue: Boolean(options.isAttributeValue) },
);

/**
 * Convert HTML email content to visible text without executing or rendering it.
 * @param {string} html
 * @returns {string}
 */
const htmlToVisibleText = (html) => {
  const withoutNonVisibleBlocks = String(html || "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|template|svg|head|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<(br|hr)\b[^>]*\/?\s*>/gi, "\n")
    .replace(/<\/(address|article|aside|blockquote|div|footer|h[1-6]|header|li|main|nav|p|pre|section|table|tr)\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ");
  return decodeHtmlEntities(withoutNonVisibleBlocks);
};

/**
 * Normalize decoded, visible text while retaining useful paragraph breaks.
 * @param {string} value
 * @returns {string}
 */
const normalizeVisibleText = (value) => String(value || "")
  .normalize("NFKC")
  .replace(/[\u200b-\u200d\u2060\ufeff]/g, "")
  .replace(/\r\n|\r/g, "\n")
  .replace(/[\t\v\f\u00a0 ]+/g, " ")
  .replace(/ *\n */g, "\n")
  .replace(/\n{3,}/g, "\n\n")
  .trim();

/**
 * Remove punctuation that commonly follows a URL in prose.
 * @param {string} value
 * @returns {string}
 */
const cleanUrlCandidate = (value) => {
  let candidate = String(value || "").replace(/[.,;:!?]+$/g, "");
  const pairs = [["(", ")"], ["[", "]"], ["{", "}"]];
  for (const [opening, closing] of pairs) {
    while (candidate.endsWith(closing)) {
      const openingCount = candidate.split(opening).length - 1;
      const closingCount = candidate.split(closing).length - 1;
      if (closingCount <= openingCount) break;
      candidate = candidate.slice(0, -1);
    }
  }
  return candidate;
};

/**
 * Extract ordered, deduplicated HTTP(S) URLs.
 * @param {...string} sources
 * @returns {string[]}
 */
const extractHttpUrls = (...sources) => {
  const urls = [];
  const seen = new Set();
  const input = decodeHtmlEntities(sources.filter(Boolean).join("\n"));
  const matches = input.match(/https?:\/\/[^\s<>"'`]+/gi) || [];

  for (const match of matches) {
    const candidate = cleanUrlCandidate(match);
    try {
      const parsed = new URL(candidate);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") continue;
      const key = `${parsed.protocol}//${parsed.host.toLowerCase()}${parsed.pathname}${parsed.search}${parsed.hash}`;
      if (seen.has(key)) continue;
      seen.add(key);
      urls.push(candidate);
    } catch (_error) {
      // Malformed URL-like text is not returned as a usable URL.
    }
  }

  return urls;
};

/**
 * Extract HTTP(S) destinations from anchor elements. Resource references such
 * as image src, stylesheet href, and script content are intentionally ignored:
 * they are not destinations the recipient can navigate to from the message.
 * @param {string} html
 * @returns {string[]}
 */
const extractAnchorHrefs = (html) => {
  const hrefs = [];
  const sourceHtml = String(html || "");
  const anchorPattern = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/gi;
  let match;

  while ((match = anchorPattern.exec(sourceHtml)) !== null) {
    hrefs.push(decodeHtmlEntities(
      match[1] ?? match[2] ?? match[3] ?? "",
      { isAttributeValue: true },
    ).replace(/[\t\n\r]/g, ""));
  }

  return extractHttpUrls(...hrefs);
};

/**
 * Extract URLs relevant to message navigation from HTML: explicit anchor
 * destinations plus URL text a recipient can actually see. This keeps
 * tracking pixels, scripts, stylesheets, and other resource fetches out of
 * reputation lookups.
 * @param {string} html
 * @returns {string[]}
 */
const extractHtmlNavigationUrls = (html) => {
  const visibleText = normalizeVisibleText(htmlToVisibleText(html));
  return extractHttpUrls(...extractAnchorHrefs(html), visibleText);
};

const emptyMimeResult = () => ({
  attachments: [],
  htmlParts: [],
  plainParts: [],
  urlSources: [],
  visibleText: "",
});

const combineMimeResults = (results, subtype) => {
  const combined = emptyMimeResult();
  for (const result of results) {
    combined.attachments.push(...result.attachments);
    combined.htmlParts.push(...result.htmlParts);
    combined.plainParts.push(...result.plainParts);
    combined.urlSources.push(...result.urlSources);
  }

  if (subtype === "alternative") {
    const plainChoice = results.find((result) => result.plainParts.some((part) => normalizeVisibleText(part)));
    const selected = plainChoice || [...results].reverse().find((result) => result.visibleText);
    combined.visibleText = selected ? selected.visibleText : "";
  } else {
    combined.visibleText = results
      .map((result) => result.visibleText)
      .filter(Boolean)
      .join("\n\n");
  }

  return combined;
};

const safeFilename = (value) => {
  const decoded = decodeEncodedWords(String(value || ""))
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();
  return decoded ? decoded.split(/[\\/]/).pop().slice(0, 512) : null;
};

/**
 * Parse a MIME entity recursively.
 * @param {string} headerSection
 * @param {string} bodySection
 * @param {number} depth
 * @param {boolean} [binarySource] Whether the entity is backed by a one-byte
 * per character representation of raw input bytes.
 * @returns {{ attachments: object[], htmlParts: string[], plainParts: string[], urlSources: string[], visibleText: string }}
 */
const parseMimeEntity = (headerSection, bodySection, depth = 0, binarySource = false) => {
  if (depth > MAX_MIME_DEPTH) return emptyMimeResult();

  const { headers, headerValues } = parseHeaderBlock(headerSection);
  const contentType = parseStructuredHeader(headerValues["content-type"]?.[0] || "text/plain");
  const disposition = parseStructuredHeader(headerValues["content-disposition"]?.[0] || "");
  const mediaType = contentType.value || "text/plain";
  const transferEncoding = (headerValues["content-transfer-encoding"]?.[0] || "7bit").toLowerCase();
  const filename = safeFilename(
    getMimeParameter(disposition.parameters, "filename")
      || getMimeParameter(contentType.parameters, "name"),
  );
  const dispositionType = disposition.value || "";
  const isMultipart = mediaType.startsWith("multipart/");
  const isDisplayableText = mediaType === "text/plain" || mediaType === "text/html";
  const isAttachment = dispositionType === "attachment"
    || Boolean(filename)
    || (!isMultipart && !isDisplayableText && mediaType !== "message/rfc822");

  if (isAttachment) {
    const decoded = decodeTransferBuffer(bodySection, transferEncoding, "", binarySource);
    const contentId = (headerValues["content-id"]?.[0] || "")
      .trim()
      .replace(/^<|>$/g, "") || null;
    return {
      ...emptyMimeResult(),
      attachments: [{
        filename,
        contentType: mediaType,
        disposition: dispositionType || (contentId ? "inline" : "attachment"),
        transferEncoding,
        contentId,
        size: decoded.length,
        inline: dispositionType === "inline" || Boolean(contentId),
      }],
    };
  }

  if (isMultipart) {
    const boundary = getMimeParameter(contentType.parameters, "boundary");
    const parts = splitMultipartBody(bodySection, boundary);
    const parsedParts = parts.map((part) => {
      const split = findHeaderBodySeparator(part);
      if (split.index === -1) return parseMimeEntity("", part, depth + 1, binarySource);
      return parseMimeEntity(
        part.slice(0, split.index),
        part.slice(split.index + split.length),
        depth + 1,
        binarySource,
      );
    });
    return combineMimeResults(parsedParts, mediaType.slice("multipart/".length));
  }

  if (mediaType === "message/rfc822") {
    const decodedMessage = decodeTransferBuffer(
      bodySection,
      transferEncoding,
      "",
      binarySource,
    ).toString("latin1");
    const split = findHeaderBodySeparator(decodedMessage);
    if (split.index !== -1) {
      return parseMimeEntity(
        decodedMessage.slice(0, split.index),
        decodedMessage.slice(split.index + split.length),
        depth + 1,
        true,
      );
    }
  }

  const charset = getMimeParameter(contentType.parameters, "charset") || "utf-8";
  const decodedText = decodeBuffer(
    decodeTransferBuffer(bodySection, transferEncoding, charset, binarySource),
    charset,
  );
  const result = emptyMimeResult();

  if (mediaType === "text/html") {
    result.htmlParts.push(decodedText.trim());
    result.visibleText = normalizeVisibleText(htmlToVisibleText(decodedText));
    result.urlSources.push(...extractAnchorHrefs(decodedText), result.visibleText);
  } else {
    result.plainParts.push(decodedText.trim());
    result.urlSources.push(decodedText);
    result.visibleText = normalizeVisibleText(decodedText);
  }

  return result;
};

/**
 * Determine whether an input has a credible RFC 5322 envelope rather than
 * merely containing a colon in ordinary text.
 * @param {Record<string, string[]>} headerValues
 * @param {boolean} hasSeparator
 * @returns {boolean}
 */
const looksLikeRawEmail = (headerValues, hasSeparator) => {
  const names = Object.keys(headerValues);
  const recognized = names.filter((name) => RAW_EMAIL_HEADERS.has(name));
  return hasSeparator && recognized.length > 0;
};

/**
 * Parse a raw email string (RFC 5322 format).
 * @param {string|Buffer} rawText - The raw email text or original bytes
 * @returns {{
 *   from: string,
 *   to: string,
 *   subject: string,
 *   date: string,
 *   headers: object,
 *   headerValues: Record<string, string[]>,
 *   body: string,
 *   htmlBody: string,
 *   text: string,
 *   normalizedText: string,
 *   urls: string[],
 *   attachments: object[],
 *   isRawEmail: boolean
 * }}
 */
const parseRawEmail = (rawText) => {
  const binarySource = Buffer.isBuffer(rawText);
  const source = binarySource ? rawText.toString("latin1") : String(rawText || "");
  const split = findHeaderBodySeparator(source);
  const candidateHeaderSection = split.index === -1 ? source : source.slice(0, split.index);
  const parsedHeaders = parseHeaderBlock(candidateHeaderSection);
  const isRawEmail = looksLikeRawEmail(parsedHeaders.headerValues, split.index !== -1);

  if (!isRawEmail) {
    const plainSource = binarySource ? decodeUnlabelledBuffer(rawText) : source;
    const normalizedText = normalizeVisibleText(plainSource);
    const looksLikeHtml = /<(?:a|body|div|html|img|p|script|style)\b/i.test(plainSource);
    return {
      from: "",
      to: "",
      subject: "",
      date: "",
      headers: {},
      headerValues: {},
      body: plainSource,
      htmlBody: "",
      text: normalizedText,
      normalizedText,
      urls: looksLikeHtml ? extractHtmlNavigationUrls(plainSource) : extractHttpUrls(plainSource),
      attachments: [],
      isRawEmail: false,
    };
  }

  const bodySection = split.index === -1 ? "" : source.slice(split.index + split.length);
  const mime = parseMimeEntity(candidateHeaderSection, bodySection, 0, binarySource);
  const body = mime.plainParts.filter(Boolean).join("\n\n").trim();
  const htmlBody = mime.htmlParts.filter(Boolean).join("\n\n").trim();
  const normalizedText = normalizeVisibleText(mime.visibleText);

  return {
    from: parsedHeaders.headers.from || "",
    to: parsedHeaders.headers.to || "",
    subject: parsedHeaders.headers.subject || "",
    date: parsedHeaders.headers.date || "",
    headers: parsedHeaders.headers,
    headerValues: parsedHeaders.headerValues,
    body,
    htmlBody,
    text: normalizedText,
    normalizedText,
    urls: extractHttpUrls(...mime.urlSources),
    attachments: mime.attachments,
    isRawEmail: true,
  };
};

/**
 * Extract SPF, DKIM, and DMARC status tokens from parsed headers. A null value
 * means no result was present; "unknown" means a result token was present but
 * is not defined for that authentication method.
 * @param {object} headers - Parsed headers object (lowercase keys)
 * @returns {{ spf: string|null, dkim: string|null, dmarc: string|null }}
 */
const extractAuthHeaders = (headers = {}) => {
  const sourceHeaders = headers && typeof headers === "object" ? headers : {};
  const authResults = Array.isArray(sourceHeaders["authentication-results"])
    ? sourceHeaders["authentication-results"].join("; ")
    : String(sourceHeaders["authentication-results"] || "");
  const receivedSpf = Array.isArray(sourceHeaders["received-spf"])
    ? sourceHeaders["received-spf"].join("; ")
    : String(sourceHeaders["received-spf"] || "");

  const readResult = (method) => {
    const match = new RegExp(`(?:^|[;\\s])${method}\\s*=\\s*([A-Za-z][A-Za-z0-9_-]*)`, "i")
      .exec(authResults);
    if (!match) return null;
    const status = match[1].toLowerCase();
    return AUTH_STATUSES[method].has(status) ? status : "unknown";
  };

  let spf = readResult("spf");
  if (spf === null && receivedSpf) {
    const match = /^\s*([A-Za-z][A-Za-z0-9_-]*)/.exec(receivedSpf);
    if (match) {
      const status = match[1].toLowerCase();
      spf = AUTH_STATUSES.spf.has(status) ? status : "unknown";
    }
  }

  return {
    spf,
    dkim: readResult("dkim"),
    dmarc: readResult("dmarc"),
  };
};

/**
 * Escape special regex characters in a string.
 * @param {string} value
 * @returns {string}
 */
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  parseRawEmail,
  extractAuthHeaders,
  decodeEncodedWords,
  decodeQuotedPrintable,
  extractAnchorHrefs,
  extractHtmlNavigationUrls,
  extractHttpUrls,
  htmlToVisibleText,
  normalizeVisibleText,
  parseHeaderBlock,
};
