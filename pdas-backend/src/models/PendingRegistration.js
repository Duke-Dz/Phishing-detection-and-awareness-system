const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const PendingRegistration = sequelize.define(
  "PendingRegistration",
  {
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      primaryKey: true,
      validate: {
        isEmail: true,
      },
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    password_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    verification_token_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "pending_registrations",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["username"], unique: true },
      { fields: ["verification_token_hash"], unique: true },
      { fields: ["expires_at"] },
    ],
  },
);

module.exports = PendingRegistration;
