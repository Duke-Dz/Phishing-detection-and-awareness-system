"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex("scan_results", ["user_id", "analyzed_at"], {
      name: "scan_results_user_analyzed_idx",
    });
    await queryInterface.addIndex("scan_results", ["user_id", "scan_type", "analyzed_at"], {
      name: "scan_results_user_type_analyzed_idx",
    });
    await queryInterface.addIndex("notifications", ["user_id", "is_read", "created_at"], {
      name: "notifications_user_read_created_idx",
    });
    await queryInterface.addIndex("pending_registrations", ["email", "expires_at"], {
      name: "pending_registrations_email_expires_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("pending_registrations", "pending_registrations_email_expires_idx");
    await queryInterface.removeIndex("notifications", "notifications_user_read_created_idx");
    await queryInterface.removeIndex("scan_results", "scan_results_user_type_analyzed_idx");
    await queryInterface.removeIndex("scan_results", "scan_results_user_analyzed_idx");
  },
};
