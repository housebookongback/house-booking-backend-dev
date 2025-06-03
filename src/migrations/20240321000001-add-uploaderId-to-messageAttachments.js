'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, add the uploaderId column as nullable
    await queryInterface.addColumn('MessageAttachments', 'uploaderId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Update existing attachments to set uploaderId to the message sender
    await queryInterface.sequelize.query(`
      UPDATE "MessageAttachments" ma
      SET "uploaderId" = m."senderId"
      FROM "Messages" m
      WHERE ma."messageId" = m.id
    `);

    // Now make the column non-nullable
    await queryInterface.changeColumn('MessageAttachments', 'uploaderId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Add index for better query performance
    await queryInterface.addIndex('MessageAttachments', ['uploaderId'], {
      name: 'message_attachments_uploader_id_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the index first
    await queryInterface.removeIndex('MessageAttachments', 'message_attachments_uploader_id_idx');
    
    // Then remove the column
    await queryInterface.removeColumn('MessageAttachments', 'uploaderId');
  }
}; 