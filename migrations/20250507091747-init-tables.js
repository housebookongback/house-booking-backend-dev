'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // First create the Listings table
    await queryInterface.createTable('Listings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // ... other required columns ...
      stepStatus: {
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
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Listings');
  }
};
