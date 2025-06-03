'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change the defaultValue for maximumNights to 365
    await queryInterface.changeColumn('Listings', 'maximumNights', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 365
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to the original default value of 1
    await queryInterface.changeColumn('Listings', 'maximumNights', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });
  }
}; 