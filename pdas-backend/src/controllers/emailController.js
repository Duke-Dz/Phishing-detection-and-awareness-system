const { analyzeMessage } = require("../services/detectionService");
const { createError, requireFields } = require("../utils/validators");
const { createScanNotification } = require("../services/notificationService");
const { persistScanResult } = require("../services/scanPersistenceService");
const { createScanJob } = require("../services/scanJobService");

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

module.exports = { analyzeEmail, parseHeaders };
