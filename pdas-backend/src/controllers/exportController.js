const { Op } = require("sequelize");
const { stringify } = require("csv-stringify/sync");
const { ScanResult } = require("../models");
const { createError } = require("../utils/validators");

const MAX_EXPORT_RECORDS = 1000;
const FORMULA_PREFIX = /^[=+\-@]/;

const neutralizeCsvFormula = (value) => {
  if (typeof value !== "string") return value;
  return FORMULA_PREFIX.test(value) ? `'${value}` : value;
};

const exportScanHistory = async (req, res) => {
  const format = (req.query.format || "csv").toLowerCase();

  if (!["csv", "json"].includes(format)) {
    throw createError("format must be csv or json", 400);
  }

  const where = { user_id: req.user.user_id };

  if (req.query.start_date || req.query.end_date) {
    where.analyzed_at = {};
    if (req.query.start_date) {
      where.analyzed_at[Op.gte] = new Date(req.query.start_date);
    }
    if (req.query.end_date) {
      where.analyzed_at[Op.lte] = new Date(req.query.end_date);
    }
  }

  const scans = await ScanResult.findAll({
    where,
    order: [["analyzed_at", "DESC"]],
    limit: MAX_EXPORT_RECORDS,
    attributes: [
      "scan_id",
      "target",
      "scan_type",
      "risk_score",
      "classification",
      "engine_version",
      "analyzed_at",
    ],
    raw: true,
  });

  if (format === "json") {
    return res.json({
      success: true,
      count: scans.length,
      data: scans,
    });
  }

  // CSV format
  const columns = [
    { key: "scan_id", header: "Scan ID" },
    { key: "target", header: "Target" },
    { key: "scan_type", header: "Scan Type" },
    { key: "risk_score", header: "Risk Score" },
    { key: "classification", header: "Classification" },
    { key: "engine_version", header: "Engine Version" },
    { key: "analyzed_at", header: "Analyzed At" },
  ];

  const safeRows = scans.map((scan) => ({
    ...scan,
    target: neutralizeCsvFormula(scan.target),
  }));

  const csv = stringify(safeRows, {
    header: true,
    columns,
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="scan-history-${timestamp}.csv"`,
  );
  res.send(csv);
};

module.exports = { exportScanHistory };
