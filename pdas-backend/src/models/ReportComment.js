const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const ReportComment = sequelize.define(
  "ReportComment",
  {
    comment_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    report_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "report_comments",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ReportComment;
