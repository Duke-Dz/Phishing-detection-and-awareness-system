"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const settings = [
      {
        key: "contact_email",
        value: "support@cybersense.example.com",
        description: "Official support email address",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        key: "twitter_url",
        value: "https://twitter.com/cybersense_security",
        description: "Official Twitter/X handle",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        key: "linkedin_url",
        value: "https://linkedin.com/company/cybersense",
        description: "Official LinkedIn page",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        key: "hero_text",
        value: "Protecting your organization from next-generation phishing threats.",
        description: "Main headline on the public landing page",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert("system_settings", settings, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("system_settings", null, {});
  },
};
