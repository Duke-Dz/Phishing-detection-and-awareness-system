"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("awareness_content", {
      content_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM("email", "url", "sms", "social", "advanced", "security"),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      difficulty: {
        type: Sequelize.ENUM("beginner", "intermediate", "advanced"),
        defaultValue: "beginner",
      },
      duration_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
      },
      is_published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "user_id" },
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

    await queryInterface.addIndex("awareness_content", ["category"]);
    await queryInterface.addIndex("awareness_content", ["difficulty"]);
    await queryInterface.addIndex("awareness_content", ["is_published"]);
    await queryInterface.addIndex("awareness_content", ["created_by"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("awareness_content");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_awareness_content_category";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_awareness_content_difficulty";');
  },
};
