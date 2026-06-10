const { Report, ScanResult } = require("../models");

const shouldCreateReviewReport = (analysis) =>
  !analysis.report_id && ["suspicious", "phishing"].includes(analysis.classification);

const ensureReviewReport = async ({ user_id, report_id = null, analysis }) => {
  if (report_id || !shouldCreateReviewReport(analysis)) {
    return report_id;
  }

  const report = await Report.create({
    user_id,
    report_type: analysis.scan_type,
    content: analysis.target,
    status: "pending",
    notes: `Auto-created from ${analysis.classification} scan (${analysis.risk_score}/100).`,
  });

  return report.report_id;
};

const persistScanResult = async ({ user_id, report_id = null, analysis }) => {
  const linkedReportId = await ensureReviewReport({ user_id, report_id, analysis });

  return ScanResult.create({
    user_id,
    report_id: linkedReportId,
    target: analysis.target,
    scan_type: analysis.scan_type,
    risk_score: analysis.risk_score,
    classification: analysis.classification,
    detection_details: analysis.detection_details,
    engine_version: analysis.detection_details?.engine_version,
  });
};

module.exports = { ensureReviewReport, persistScanResult };
