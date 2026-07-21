const { analyzeMessage } = require("../services/detectionService");
const { createError, requireFields } = require("../utils/inputValidation");
const { createScanNotification } = require("../services/notificationService");
const { persistScanResult } = require("../services/scanPersistenceService");
const { createScanJob } = require("../services/scanJobService");
const { parseRawEmail, extractAuthHeaders } = require("../utils/emailParser");

const analyzeEmail = async (req, res) => {
  requireFields(req.body, ["content"]);

  if (req.query.async === "true" || req.body.async === true) {
    const job = await createScanJob({
      user_id: req.user.user_id,
      scan_type: "email",
      target: String(req.body.content),
    });

    return res.status(202).json({
      success: true,
      message: "Email scan queued",
      data: job,
    });
  }

  const analysis = await analyzeMessage(req.body.content, "email");
  const scanResult = await persistScanResult({
    user_id: req.user.user_id,
    analysis,
  });

  await createScanNotification({ user_id: req.user.user_id, scanResult, report_id: scanResult.report_id });

  res.status(201).json({
    success: true,
    data: scanResult,
  });
};

const parseHeaders = async (req, res) => {
  requireFields(req.body, ["headers"]);

  const headers = String(req.body.headers)
    .split(/\r?\n/)
    .reduce((result, line) => {
      const separator = line.indexOf(":");
      if (separator > -1) {
        result[line.slice(0, separator).trim().toLowerCase()] = line
          .slice(separator + 1)
          .trim();
      }
      return result;
    }, {});

  if (!Object.keys(headers).length) {
    throw createError("No valid email headers were found");
  }

  res.json({
    success: true,
    data: headers,
  });
};

const analyzeEmailWebhook = async (req, res) => {
  // Accept raw email text from body.raw_email or as plain text body
  const rawEmail = req.body.raw_email || (typeof req.body === "string" ? req.body : null);

  if (!rawEmail) {
    throw createError("Missing required field: raw_email");
  }

  // Parse the raw email
  const parsed = parseRawEmail(rawEmail);
  const authResults = extractAuthHeaders(parsed.headers);

  if (!parsed.isRawEmail || ![parsed.subject, parsed.normalizedText, parsed.htmlBody].some(Boolean)) {
    throw createError("Could not extract any content from the raw email");
  }

  // Analyze the original MIME message so headers, parts, links, and
  // attachments remain available to the detector.
  const analysis = await analyzeMessage(rawEmail, "email");

  // Persist scan result
  const scanResult = await persistScanResult({
    user_id: req.user.user_id,
    analysis,
  });

  await createScanNotification({ user_id: req.user.user_id, scanResult, report_id: scanResult.report_id });

  res.status(201).json({
    success: true,
    data: {
      ...scanResult.toJSON(),
      parsed_email: {
        from: parsed.from,
        to: parsed.to,
        subject: parsed.subject,
        date: parsed.date,
        authentication: authResults,
      },
    },
  });
};

module.exports = { analyzeEmail, parseHeaders, analyzeEmailWebhook };
