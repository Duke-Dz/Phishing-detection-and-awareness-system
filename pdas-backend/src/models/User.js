const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const User = sequelize.define(
  "User",
  {
    user_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("user", "analyst", "admin"),
      defaultValue: "user",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    mfa_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    mfa_secret: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["email"], unique: true },
      { fields: ["role"] },
      { fields: ["is_active"] },
      { fields: ["created_at"] },
    ],
    defaultScope: {
      attributes: { exclude: ["password_hash", "mfa_secret"] },
    },
    scopes: {
      withPassword: {
        attributes: {},
      },
      withSecurity: {
        attributes: {},
      },
    },
  },
);

module.exports = User;
