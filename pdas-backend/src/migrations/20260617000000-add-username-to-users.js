"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add column allowing null first
    await queryInterface.addColumn("users", "username", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    // 2. We can't easily set unique usernames for existing rows without knowing them,
    // so we set them to the email prefix or a UUID as a fallback to avoid unique constraint violations
    await queryInterface.sequelize.query(`
      UPDATE users SET username = CONCAT('user_', SUBSTRING(MD5(user_id), 1, 8)) WHERE username IS NULL;
    `);

    // 3. Now change column to not null and add unique constraint
    await queryInterface.changeColumn("users", "username", {
      type: Sequelize.STRING(50),
      allowNull: false,
    });

    await queryInterface.addIndex("users", ["username"], {
      unique: true,
      name: "users_username_unique",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex("users", "users_username_unique");
    await queryInterface.removeColumn("users", "username");
  },
};
