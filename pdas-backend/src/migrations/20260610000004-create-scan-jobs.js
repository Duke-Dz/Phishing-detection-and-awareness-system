"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("scan_jobs", {
      job_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "user_id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      report_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "reports", key: "report_id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      scan_type: {
        type: Sequelize.ENUM("url", "email", "sms"),
        allowNull: false,
      },
      target: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("queued", "processing", "completed", "failed"),
        defaultValue: "queued",
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      max_attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
      },
      last_error: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      scan_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "scan_results", key: "scan_id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    await queryInterface.addIndex("scan_jobs", ["user_id"]);
    await queryInterface.addIndex("scan_jobs", ["status", "created_at"]);
    await queryInterface.addIndex("scan_jobs", ["scan_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("scan_jobs");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_scan_jobs_scan_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_scan_jobs_status";');
  },
};
