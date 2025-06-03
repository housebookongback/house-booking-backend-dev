'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Listings', 'adultGuests', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
      after: 'accommodates'
    });

    await queryInterface.addColumn('Listings', 'childGuests', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      after: 'adultGuests'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Listings', 'adultGuests');
    await queryInterface.removeColumn('Listings', 'childGuests');
  }
}; 