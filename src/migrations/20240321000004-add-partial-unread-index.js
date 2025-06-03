'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add partial index for unread messages if it doesn't exist
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE indexname = 'msg_unread_idx'
        ) THEN
          CREATE INDEX "msg_unread_idx" ON "Messages" ("conversationId")
          WHERE "readAt" IS NULL;
        END IF;
      END $$;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the partial index if it exists
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS "msg_unread_idx"
    `);
  }
}; 