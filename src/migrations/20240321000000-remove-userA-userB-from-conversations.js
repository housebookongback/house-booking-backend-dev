'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, verify that all conversations have corresponding ConversationParticipant records
    const conversations = await queryInterface.sequelize.query(
      `SELECT c.id, c."userA", c."userB" 
       FROM "Conversations" c 
       LEFT JOIN "ConversationParticipants" cp1 ON c.id = cp1."conversationId" AND c."userA" = cp1."userId"
       LEFT JOIN "ConversationParticipants" cp2 ON c.id = cp2."conversationId" AND c."userB" = cp2."userId"
       WHERE cp1.id IS NULL OR cp2.id IS NULL`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (conversations.length > 0) {
      console.log('Found conversations without proper participant records. Creating them...');
      
      // Create missing ConversationParticipant records
      for (const conv of conversations) {
        if (conv.userA) {
          await queryInterface.sequelize.query(
            `INSERT INTO "ConversationParticipants" ("conversationId", "userId", "role", "createdAt", "updatedAt")
             VALUES (${conv.id}, ${conv.userA}, 'guest', NOW(), NOW())
             ON CONFLICT ("conversationId", "userId") DO NOTHING`
          );
        }
        if (conv.userB) {
          await queryInterface.sequelize.query(
            `INSERT INTO "ConversationParticipants" ("conversationId", "userId", "role", "createdAt", "updatedAt")
             VALUES (${conv.id}, ${conv.userB}, 'host', NOW(), NOW())
             ON CONFLICT ("conversationId", "userId") DO NOTHING`
          );
        }
      }
    }

    // Remove foreign key constraints first
    await queryInterface.removeConstraint(
      'Conversations',
      'Conversations_userA_fkey'
    );
    await queryInterface.removeConstraint(
      'Conversations',
      'Conversations_userB_fkey'
    );

    // Remove the columns
    await queryInterface.removeColumn('Conversations', 'userA');
    await queryInterface.removeColumn('Conversations', 'userB');
  },

  down: async (queryInterface, Sequelize) => {
    // Add the columns back
    await queryInterface.addColumn('Conversations', 'userA', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('Conversations', 'userB', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Restore data from ConversationParticipants
    await queryInterface.sequelize.query(`
      UPDATE "Conversations" c
      SET 
        "userA" = (
          SELECT cp."userId"
          FROM "ConversationParticipants" cp
          WHERE cp."conversationId" = c.id
          AND cp."role" = 'guest'
          LIMIT 1
        ),
        "userB" = (
          SELECT cp."userId"
          FROM "ConversationParticipants" cp
          WHERE cp."conversationId" = c.id
          AND cp."role" = 'host'
          LIMIT 1
        )
    `);
  }
}; 