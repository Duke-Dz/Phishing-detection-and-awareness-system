const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const SecurityEvent = sequelize.define(
  "SecurityEvent",
  {
    id: {
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
    event_type: {
      type: DataTypes.ENUM(
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'PASSWORD_RESET',
        'PASSWORD_RESET_REQUESTED',
        'PASSWORD_RESET_COMPLETED',
        'PASSWORD_CHANGED',
        'MFA_ENABLED',
        'MFA_DISABLED',
        'ACCOUNT_LOCKED',
        'TOKEN_REPLAY_DETECTED',
        'EMAIL_VERIFIED',
        'ACCOUNT_REGISTERED'
      ),
      allowNull: false,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "security_events",
    timestamps: true,
    updatedAt: false, // Security logs don't need updatedAt
    underscored: true,
  }
);

module.exports = SecurityEvent;