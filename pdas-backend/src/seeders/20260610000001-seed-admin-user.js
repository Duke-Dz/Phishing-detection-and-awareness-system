"use strict";

const bcrypt = require("bcryptjs");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const adminName = process.env.SEED_ADMIN_NAME || "System Administrator";

    if (!adminEmail || !adminPassword) {
      throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required to seed the admin user");
    }

    if (adminPassword.length < 12) {
      throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters long");
    }

    const passwordHash = bcrypt.hashSync(adminPassword, 12);

    await queryInterface.bulkInsert("users", [
      {
        user_id: "00000000-0000-4000-a000-000000000001",
        full_name: adminName,
        email: adminEmail.toLowerCase(),
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
    if (!process.env.SEED_ADMIN_EMAIL) {
      return;
    }

    await queryInterface.bulkDelete("users", {
      email: process.env.SEED_ADMIN_EMAIL.toLowerCase(),
    });
  },
};
