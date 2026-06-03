const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const Notification = sequelize.define(
  "Notification",
  {
    notification_id: {
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
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("alert", "info", "warning", "success"),
      defaultValue: "info",
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    related_report_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["is_read"] },
      { fields: ["created_at"] },
    ],
  },
);

module.exports = Notification;
