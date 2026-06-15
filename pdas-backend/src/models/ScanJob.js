const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const ScanJob = sequelize.define(
  "ScanJob",
  {
    job_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    report_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "reports",
        key: "report_id",
      },
    },
    scan_type: {
      type: DataTypes.ENUM("url", "email", "sms"),
      allowNull: false,
    },
    target: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("queued", "processing", "completed", "failed"),
      defaultValue: "queued",
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    max_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
    },
    last_error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    scan_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "scan_results",
        key: "scan_id",
      },
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "scan_jobs",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["status", "created_at"] },
      { fields: ["scan_id"] },
    ],
  },
);

module.exports = ScanJob;
