'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Listings', 'stepStatus', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {
        basicInfo: false,
        location: false,
        details: false,
        pricing: false,
        photos: false,
        rules: false,
        calendar: false
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Listings', 'stepStatus');
  }
};
