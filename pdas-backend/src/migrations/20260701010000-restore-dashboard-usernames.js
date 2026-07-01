"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const users = await queryInterface.describeTable("users");
    const pendingRegistrations = await queryInterface.describeTable("pending_registrations");

    if (!users.username) {
      await queryInterface.addColumn("users", "username", {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
      await queryInterface.sequelize.query(`
        UPDATE users
        SET username = CONCAT('user_', SUBSTRING(MD5(user_id::text), 1, 12))
        WHERE username IS NULL
      `);
      await queryInterface.changeColumn("users", "username", {
        type: Sequelize.STRING(50),
        allowNull: false,
      });
    }

    const userIndexes = await queryInterface.showIndex("users");
    if (!userIndexes.some((index) => index.name === "users_username_unique")) {
      await queryInterface.addIndex("users", ["username"], {
        unique: true,
        name: "users_username_unique",
      });
    }

    if (!pendingRegistrations.username) {
      await queryInterface.addColumn("pending_registrations", "username", {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
      await queryInterface.sequelize.query(`
        UPDATE pending_registrations
        SET username = CONCAT('pending_', SUBSTRING(MD5(email), 1, 12))
        WHERE username IS NULL
      `);
      await queryInterface.changeColumn("pending_registrations", "username", {
        type: Sequelize.STRING(50),
        allowNull: false,
      });
    }

    const pendingIndexes = await queryInterface.showIndex("pending_registrations");
    if (!pendingIndexes.some((index) => index.name === "pending_registrations_username_unique")) {
      await queryInterface.addIndex("pending_registrations", ["username"], {
        unique: true,
        name: "pending_registrations_username_unique",
      });
    }
  },

  async down() {
    // Usernames are a core account identity. Do not remove identity data on rollback.
  },
};
