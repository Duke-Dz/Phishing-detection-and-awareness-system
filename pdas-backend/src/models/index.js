const User = require("./User");
const Report = require("./Report");
const ScanResult = require("./ScanResult");
const ThreatIntelligence = require("./ThreatIntelligence");
const Notification = require("./Notification");
const AwarenessContent = require("./AwarenessContent");
const RefreshToken = require("./RefreshToken");
const ScanJob = require("./ScanJob");
const PasswordResetToken = require("./PasswordResetToken");
const EmailVerificationToken = require("./EmailVerificationToken");
const AuditLog = require("./AuditLog");
const SystemSetting = require("./SystemSetting");
const ReportComment = require("./ReportComment");
const PendingRegistration = require("./PendingRegistration");

// ── User → Reports (cascade: delete user = delete their reports) ──
User.hasMany(Report, { foreignKey: "user_id", as: "reports", onDelete: "CASCADE" });
Report.belongsTo(User, { foreignKey: "user_id", as: "author" });

// ── Report → ScanResult (set null: keep scan data for analytics) ──
Report.hasOne(ScanResult, { foreignKey: "report_id", as: "scanResult", onDelete: "SET NULL" });
ScanResult.belongsTo(Report, { foreignKey: "report_id", as: "report" });

// ── User → ScanResults (set null: preserve scan data for analytics) ──
User.hasMany(ScanResult, { foreignKey: "user_id", as: "scanResults", onDelete: "SET NULL" });
ScanResult.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ── User → Notifications (cascade: no need to keep orphaned notifications) ──
User.hasMany(Notification, { foreignKey: "user_id", as: "notifications", onDelete: "CASCADE" });
Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ── Notification → Report (set null: keep notification even if report deleted) ──
Notification.belongsTo(Report, { foreignKey: "related_report_id", as: "relatedReport", onDelete: "SET NULL" });

// ── User → RefreshTokens (cascade: tokens meaningless without user) ──
User.hasMany(RefreshToken, { foreignKey: "user_id", as: "refreshTokens", onDelete: "CASCADE" });
RefreshToken.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ── User → ScanJobs (set null: preserve job history) ──
User.hasMany(ScanJob, { foreignKey: "user_id", as: "scanJobs", onDelete: "SET NULL" });
ScanJob.belongsTo(User, { foreignKey: "user_id", as: "user" });
ScanJob.belongsTo(Report, { foreignKey: "report_id", as: "report", onDelete: "SET NULL" });
ScanJob.belongsTo(ScanResult, { foreignKey: "scan_id", as: "scanResult", onDelete: "SET NULL" });

// ── User → AwarenessContent (set null: preserve content if creator deleted) ──
User.hasMany(AwarenessContent, { foreignKey: "created_by", as: "createdContent", onDelete: "SET NULL" });
AwarenessContent.belongsTo(User, { foreignKey: "created_by", as: "creator" });

// ── User → PasswordResetTokens (cascade: tokens meaningless without user) ──
User.hasMany(PasswordResetToken, { foreignKey: "user_id", as: "passwordResetTokens", onDelete: "CASCADE" });
PasswordResetToken.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ── User → EmailVerificationTokens (cascade: tokens meaningless without user) ──
User.hasMany(EmailVerificationToken, { foreignKey: "user_id", as: "emailVerificationTokens", onDelete: "CASCADE" });
EmailVerificationToken.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ── User → AuditLogs (set null: preserve logs even if user is deleted) ──
User.hasMany(AuditLog, { foreignKey: "user_id", as: "auditLogs", onDelete: "SET NULL" });
AuditLog.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ── Report → ReportComments (cascade: delete report = delete comments) ──
Report.hasMany(ReportComment, { foreignKey: "report_id", as: "comments", onDelete: "CASCADE" });
ReportComment.belongsTo(Report, { foreignKey: "report_id", as: "report" });

// ── User → ReportComments (cascade: delete user = delete their comments) ──
User.hasMany(ReportComment, { foreignKey: "user_id", as: "reportComments", onDelete: "CASCADE" });
ReportComment.belongsTo(User, { foreignKey: "user_id", as: "author" });

module.exports = {
  User,
  Report,
  ScanResult,
  ThreatIntelligence,
  Notification,
  AwarenessContent,
  RefreshToken,
  ScanJob,
  PasswordResetToken,
  EmailVerificationToken,
  AuditLog,
  SystemSetting,
  ReportComment,
  PendingRegistration,
};
