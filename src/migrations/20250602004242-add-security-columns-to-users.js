'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add twoFactorEnabled, twoFactorSecret, and passwordChangedAt columns to Users table
    await queryInterface.addColumn('Users', 'twoFactorEnabled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('Users', 'twoFactorSecret', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.addColumn('Users', 'passwordChangedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove columns
    await queryInterface.removeColumn('Users', 'twoFactorEnabled');
    await queryInterface.removeColumn('Users', 'twoFactorSecret');
    await queryInterface.removeColumn('Users', 'passwordChangedAt');
  }
}; 