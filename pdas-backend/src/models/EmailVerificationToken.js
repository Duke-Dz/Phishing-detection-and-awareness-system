const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const EmailVerificationToken = sequelize.define(
  "EmailVerificationToken",
  {
    token_id: {
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
    token_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "email_verification_tokens",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["token_hash"], unique: true },
      { fields: ["user_id"] },
      { fields: ["expires_at"] },
    ],
  },
);

module.exports = EmailVerificationToken;
