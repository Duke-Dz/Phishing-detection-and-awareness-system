"use strict";

const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const passwordHash = bcrypt.hashSync("Admin123!", 12);

    await queryInterface.bulkInsert("users", [
      {
        user_id: "00000000-0000-4000-a000-000000000001",
        full_name: "System Administrator",
        email: "admin@pdas.local",
        password_hash: passwordHash,
        role: "admin",
        is_active: true,
        mfa_enabled: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("users", {
      email: "admin@pdas.local",
    });
  },
};
