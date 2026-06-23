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
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        notEmpty: true,
      },
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
    avatar_url: {
      type: DataTypes.STRING,
      allowNull: true,
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
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    email_notifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    locked_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_failed_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["username"], unique: true },
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
