'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex(
      'ConversationParticipants',
      ['userId', 'lastReadAt'],
      { name: 'user_lastread_idx' }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex(
      'ConversationParticipants',
      'user_lastread_idx'
    );
  }
}; 