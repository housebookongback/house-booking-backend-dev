'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add pushSubscriptions to Users table
    await queryInterface.addColumn('Users', 'pushSubscriptions', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: []
    });

    // Add priority, scheduledFor, expiresAt to Notifications table
    await queryInterface.addColumn('Notifications', 'priority', {
      type: Sequelize.ENUM('low', 'medium', 'high'),
      allowNull: false,
      defaultValue: 'medium'
    });

    await queryInterface.addColumn('Notifications', 'scheduledFor', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Notifications', 'expiresAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add notificationSettings and lastNotifiedAt to Wishlists table
    await queryInterface.addColumn('Wishlists', 'notificationSettings', {
      type: Sequelize.JSON,
      defaultValue: {
        priceChanges: true,
        availabilityUpdates: true,
        specialOffers: true
      }
    });

    await queryInterface.addColumn('Wishlists', 'lastNotifiedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns in reverse order
    await queryInterface.removeColumn('Wishlists', 'lastNotifiedAt');
    await queryInterface.removeColumn('Wishlists', 'notificationSettings');
    await queryInterface.removeColumn('Notifications', 'expiresAt');
    await queryInterface.removeColumn('Notifications', 'scheduledFor');
    await queryInterface.removeColumn('Notifications', 'priority');
    await queryInterface.removeColumn('Users', 'pushSubscriptions');
  }
}; 