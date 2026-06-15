"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("scan_jobs", "user_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "users", key: "user_id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("scan_jobs", "user_id", {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: "users", key: "user_id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },
};
