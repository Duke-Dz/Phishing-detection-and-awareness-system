const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const Report = sequelize.define(
  "Report",
  {
    report_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id",
      },
    },
    report_type: {
      type: DataTypes.ENUM("url", "email", "sms"),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "under_review", "confirmed", "false_positive"),
      defaultValue: "pending",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "reports",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["status"] },
      { fields: ["report_type"] },
      { fields: ["created_at"] },
    ],
  },
);

module.exports = Report;
