"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const users = await queryInterface.describeTable("users");
    if (users.mfa_enabled) {
      await queryInterface.removeColumn("users", "mfa_enabled");
    }
    if (users.mfa_secret) {
      await queryInterface.removeColumn("users", "mfa_secret");
    }
  },

  async down(queryInterface, Sequelize) {
    const users = await queryInterface.describeTable("users");

    if (!users.mfa_enabled) {
      await queryInterface.addColumn("users", "mfa_enabled", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
    if (!users.mfa_secret) {
      await queryInterface.addColumn("users", "mfa_secret", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },
};
