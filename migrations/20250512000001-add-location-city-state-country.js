'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add city, state, and country columns to Locations table
     * All are optional (nullable) to not break existing data
     */
    return Promise.all([
      queryInterface.addColumn('Locations', 'city', {
        type: Sequelize.STRING,
        allowNull: true
      }),
      queryInterface.addColumn('Locations', 'state', {
        type: Sequelize.STRING,
        allowNull: true
      }),
      queryInterface.addColumn('Locations', 'country', {
        type: Sequelize.STRING,
        allowNull: true
      })
    ]);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Remove the columns on rollback
     */
    return Promise.all([
      queryInterface.removeColumn('Locations', 'city'),
      queryInterface.removeColumn('Locations', 'state'),
      queryInterface.removeColumn('Locations', 'country')
    ]);
  }
}; 