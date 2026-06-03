const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const ScanResult = sequelize.define(
  "ScanResult",
  {
    scan_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    report_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "reports",
        key: "report_id",
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    target: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    scan_type: {
      type: DataTypes.ENUM("url", "email", "sms"),
      allowNull: false,
    },
    risk_score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    classification: {
      type: DataTypes.ENUM("safe", "suspicious", "phishing"),
      allowNull: false,
    },
    detection_details: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    engine_version: {
      type: DataTypes.STRING(20),
      defaultValue: "1.0.0",
    },
    analyzed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "scan_results",
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ["report_id"] },
      { fields: ["user_id"] },
      { fields: ["classification"] },
      { fields: ["scan_type"] },
      { fields: ["analyzed_at"] },
    ],
  },
);

module.exports = ScanResult;
