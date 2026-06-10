"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("threat_intelligence", {
      threat_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true,
      },
      domain: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      reputation_score: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      is_blacklisted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      blacklist_sources: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      threat_type: {
        type: Sequelize.ENUM("phishing", "malware", "spam", "unknown"),
        defaultValue: "unknown",
      },
      last_seen: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
      last_checked: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      api_sources: {
        type: Sequelize.JSONB,
        defaultValue: [],
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

    await queryInterface.addIndex("threat_intelligence", ["domain"], { unique: true });
    await queryInterface.addIndex("threat_intelligence", ["is_blacklisted"]);
    await queryInterface.addIndex("threat_intelligence", ["threat_type"]);
    await queryInterface.addIndex("threat_intelligence", ["last_checked"]);
    await queryInterface.addIndex("threat_intelligence", ["reputation_score"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("threat_intelligence");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_threat_intelligence_threat_type";');
  },
};
