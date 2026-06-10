"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reports", {
      report_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "user_id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      report_type: {
        type: Sequelize.ENUM("url", "email", "sms"),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "under_review", "confirmed", "false_positive"),
        defaultValue: "pending",
      },
      notes: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex("reports", ["user_id"]);
    await queryInterface.addIndex("reports", ["status"]);
    await queryInterface.addIndex("reports", ["report_type"]);
    await queryInterface.addIndex("reports", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("reports");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reports_report_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_reports_status";');
  },
};
