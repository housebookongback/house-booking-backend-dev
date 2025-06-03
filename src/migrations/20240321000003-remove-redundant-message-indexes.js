'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove redundant indexes since we have the composite index
    await queryInterface.removeIndex('Messages', 'Messages_conversationId');
    await queryInterface.removeIndex('Messages', 'Messages_createdAt');
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add the indexes if needed to rollback
    await queryInterface.addIndex('Messages', ['conversationId']);
    await queryInterface.addIndex('Messages', ['createdAt']);
  }
}; 