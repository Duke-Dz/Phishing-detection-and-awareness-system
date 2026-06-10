"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("scan_results", {
      scan_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      report_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "reports", key: "report_id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "user_id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      target: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      scan_type: {
        type: Sequelize.ENUM("url", "email", "sms"),
        allowNull: false,
      },
      risk_score: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      classification: {
        type: Sequelize.ENUM("safe", "suspicious", "phishing"),
        allowNull: false,
      },
      detection_details: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      engine_version: {
        type: Sequelize.STRING(20),
        defaultValue: "1.0.0",
      },
      analyzed_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    await queryInterface.addIndex("scan_results", ["report_id"]);
    await queryInterface.addIndex("scan_results", ["user_id"]);
    await queryInterface.addIndex("scan_results", ["classification"]);
    await queryInterface.addIndex("scan_results", ["scan_type"]);
    await queryInterface.addIndex("scan_results", ["analyzed_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("scan_results");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_scan_results_scan_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_scan_results_classification";');
  },
};
