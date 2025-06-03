'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First check if the column exists
    const tableInfo = await queryInterface.describeTable('ConversationParticipants');
    if (!tableInfo.role) {
      // Add role column
      await queryInterface.addColumn('ConversationParticipants', 'role', {
        type: Sequelize.ENUM('guest', 'host'),
        allowNull: false,
        defaultValue: 'guest' // Default to guest for existing records
      });

      // Update roles based on existing data
      // If there's a listing, the listing owner should be host
      await queryInterface.sequelize.query(`
        UPDATE "ConversationParticipants" cp
        SET role = 'host'
        FROM "Conversations" c
        JOIN "Listings" l ON c."listingId" = l.id
        WHERE cp."conversationId" = c.id
        AND cp."userId" = l."ownerId"
      `);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the role column
    await queryInterface.removeColumn('ConversationParticipants', 'role');
    
    // Remove the ENUM type
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_ConversationParticipants_role";
    `);
  }
}; 