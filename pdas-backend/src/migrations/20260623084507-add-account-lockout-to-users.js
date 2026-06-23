'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('users');
    
    if (!tableDescription.failed_login_attempts) {
      await queryInterface.addColumn('users', 'failed_login_attempts', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
    }
    if (!tableDescription.locked_until) {
      await queryInterface.addColumn('users', 'locked_until', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
    if (!tableDescription.last_failed_login) {
      await queryInterface.addColumn('users', 'last_failed_login', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  async down (queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('users');
    
    if (tableDescription.failed_login_attempts) {
      await queryInterface.removeColumn('users', 'failed_login_attempts');
    }
    if (tableDescription.locked_until) {
      await queryInterface.removeColumn('users', 'locked_until');
    }
    if (tableDescription.last_failed_login) {
      await queryInterface.removeColumn('users', 'last_failed_login');
    }
  }
};
