const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const AwarenessContent = sequelize.define(
  "AwarenessContent",
  {
    content_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM("email", "url", "sms", "social", "advanced", "security"),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    difficulty: {
      type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
      defaultValue: "beginner",
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "awareness_content",
    timestamps: true,
    underscored: true,
  },
);

module.exports = AwarenessContent;
