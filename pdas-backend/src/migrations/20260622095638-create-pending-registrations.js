"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pending_registrations", {
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
        primaryKey: true,
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      full_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      password_hash: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      verification_token_hash: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("pending_registrations", ["verification_token_hash"], {
      unique: true,
      name: "pending_registrations_token_idx",
    });

    await queryInterface.addIndex("pending_registrations", ["expires_at"], {
      name: "pending_registrations_expires_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("pending_registrations");
  },
};
