const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const RefreshToken = sequelize.define(
  "RefreshToken",
  {
    refresh_token_id: {
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
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    replaced_by_hash: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
  },
  {
    tableName: "refresh_tokens",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["token_hash"], unique: true },
    ],
  },
);

module.exports = RefreshToken;
