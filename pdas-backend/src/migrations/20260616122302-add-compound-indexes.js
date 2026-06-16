'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addIndex("scan_results", ["user_id", "classification", "analyzed_at"], {
      name: "idx_scan_results_user_class_date",
    });
    await queryInterface.addIndex("reports", ["status", "created_at"], {
      name: "idx_reports_status_created",
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex("scan_results", "idx_scan_results_user_class_date");
    await queryInterface.removeIndex("reports", "idx_reports_status_created");
  }
};
