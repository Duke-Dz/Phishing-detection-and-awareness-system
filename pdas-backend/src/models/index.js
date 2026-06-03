const User = require("./User");
const Report = require("./Report");
const ScanResult = require("./ScanResult");
const ThreatIntelligence = require("./ThreatIntelligence");
const Notification = require("./Notification");
const AwarenessContent = require("./AwarenessContent");
const RefreshToken = require("./RefreshToken");
const ScanJob = require("./ScanJob");

User.hasMany(Report, { foreignKey: "user_id", as: "reports" });
Report.belongsTo(User, { foreignKey: "user_id", as: "author" });

Report.hasOne(ScanResult, { foreignKey: "report_id", as: "scanResult" });
ScanResult.belongsTo(Report, { foreignKey: "report_id", as: "report" });
User.hasMany(ScanResult, { foreignKey: "user_id", as: "scanResults" });
ScanResult.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(RefreshToken, { foreignKey: "user_id", as: "refreshTokens" });
RefreshToken.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasMany(ScanJob, { foreignKey: "user_id", as: "scanJobs" });
ScanJob.belongsTo(User, { foreignKey: "user_id", as: "user" });
ScanJob.belongsTo(Report, { foreignKey: "report_id", as: "report" });
ScanJob.belongsTo(ScanResult, { foreignKey: "scan_id", as: "scanResult" });

module.exports = {
  User,
  Report,
  ScanResult,
  ThreatIntelligence,
  Notification,
  AwarenessContent,
  RefreshToken,
  ScanJob,
};
