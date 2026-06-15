const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const SystemSetting = sequelize.define(
  "SystemSetting",
  {
    key: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "system_settings",
    timestamps: true,
    underscored: true,
  }
);

module.exports = SystemSetting;
