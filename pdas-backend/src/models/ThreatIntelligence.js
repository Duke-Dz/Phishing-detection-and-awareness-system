const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const ThreatIntelligence = sequelize.define(
  "ThreatIntelligence",
  {
    threat_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    domain: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    reputation_score: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
    },
    is_blacklisted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    blacklist_sources: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    threat_type: {
      type: DataTypes.ENUM("phishing", "malware", "spam", "unknown"),
      defaultValue: "unknown",
    },
    last_seen: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    last_checked: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    api_sources: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
  },
  {
    tableName: "threat_intelligence",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["domain"], unique: true },
      { fields: ["is_blacklisted"] },
      { fields: ["threat_type"] },
      { fields: ["last_checked"] },
      { fields: ["reputation_score"] },
    ],
  },
);

module.exports = ThreatIntelligence;
