"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable("users");

    // 1. Add username column only if it does not already exist.
    if (!table.username) {
      await queryInterface.addColumn("users", "username", {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
    }

    // 2. Fill missing usernames.
    // Cast UUID to text before MD5 because PostgreSQL md5() expects text.
    await queryInterface.sequelize.query(`
      UPDATE users
      SET username = CONCAT('user_', SUBSTRING(MD5(user_id::text), 1, 8))
      WHERE username IS NULL;
    `);

    // 3. Make username required.
    await queryInterface.changeColumn("users", "username", {
      type: Sequelize.STRING(50),
      allowNull: false,
    });

    // 4. Add unique index only if it does not already exist.
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique
      ON users (username);
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS users_username_unique;
    `);

    const table = await queryInterface.describeTable("users");
    if (table.username) {
      await queryInterface.removeColumn("users", "username");
    }
  },
};
