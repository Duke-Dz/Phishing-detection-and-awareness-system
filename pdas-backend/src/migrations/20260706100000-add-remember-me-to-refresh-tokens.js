"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("refresh_tokens");

    if (!table.remember_me) {
      await queryInterface.addColumn("refresh_tokens", "remember_me", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("refresh_tokens");

    if (table.remember_me) {
      await queryInterface.removeColumn("refresh_tokens", "remember_me");
    }
  },
};
