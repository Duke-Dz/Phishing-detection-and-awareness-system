"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("notifications", {
      notification_id: {
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
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM("alert", "info", "warning", "success"),
        defaultValue: "info",
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      related_report_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "reports", key: "report_id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
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

    await queryInterface.addIndex("notifications", ["user_id"]);
    await queryInterface.addIndex("notifications", ["is_read"]);
    await queryInterface.addIndex("notifications", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("notifications");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_type";');
  },
};
