const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const SecurityEvent = sequelize.define("SecurityEvent", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  event_type: {
    type: DataTypes.STRING,
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
    allowNull: false,
    defaultValue: {},
  },
}, {
  tableName: "SecurityEvents",
  timestamps: true,
});

module.exports = SecurityEvent;
