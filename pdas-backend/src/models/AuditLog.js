const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const AuditLog = sequelize.define(
  "AuditLog",
  {
    log_id: {
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
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    entity_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "audit_logs",
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["action"] },
      { fields: ["entity_type"] },
      { fields: ["created_at"] },
      { fields: ["entity_type", "entity_id"] },
    ],
  },
);

module.exports = AuditLog;
