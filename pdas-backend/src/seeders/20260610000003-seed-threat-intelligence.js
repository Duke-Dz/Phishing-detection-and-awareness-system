"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert("threat_intelligence", [
      {
        threat_id: "00000000-0000-4000-c000-000000000001",
        domain: "paypa1-secure.com",
        reputation_score: 95,
        is_blacklisted: true,
        blacklist_sources: "{built-in-feed,manual}",
        threat_type: "phishing",
        last_seen: now,
        last_checked: now,
        api_sources: "[]",
        created_at: now,
        updated_at: now,
      },
      {
        threat_id: "00000000-0000-4000-c000-000000000002",
        domain: "secure-login-verification.com",
        reputation_score: 90,
        is_blacklisted: true,
        blacklist_sources: "{built-in-feed}",
        threat_type: "phishing",
        last_seen: now,
        last_checked: now,
        api_sources: "[]",
        created_at: now,
        updated_at: now,
      },
      {
        threat_id: "00000000-0000-4000-c000-000000000003",
        domain: "account-update-alert.com",
        reputation_score: 85,
        is_blacklisted: true,
        blacklist_sources: "{built-in-feed}",
        threat_type: "phishing",
        last_seen: now,
        last_checked: now,
        api_sources: "[]",
        created_at: now,
        updated_at: now,
      },
      {
        threat_id: "00000000-0000-4000-c000-000000000004",
        domain: "bank-verification-now.com",
        reputation_score: 92,
        is_blacklisted: true,
        blacklist_sources: "{built-in-feed}",
        threat_type: "phishing",
        last_seen: now,
        last_checked: now,
        api_sources: "[]",
        created_at: now,
        updated_at: now,
      },
      {
        threat_id: "00000000-0000-4000-c000-000000000005",
        domain: "free-gift-winner.xyz",
        reputation_score: 88,
        is_blacklisted: true,
        blacklist_sources: "{manual}",
        threat_type: "spam",
        last_seen: now,
        last_checked: now,
        api_sources: "[]",
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("threat_intelligence", {
      threat_id: [
        "00000000-0000-4000-c000-000000000001",
        "00000000-0000-4000-c000-000000000002",
        "00000000-0000-4000-c000-000000000003",
        "00000000-0000-4000-c000-000000000004",
        "00000000-0000-4000-c000-000000000005",
      ],
    });
  },
};
