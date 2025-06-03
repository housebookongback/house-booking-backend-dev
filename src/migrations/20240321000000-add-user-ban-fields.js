'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // First check if columns already exist
        const tableInfo = await queryInterface.describeTable('Users', { transaction });
        
        // Add bannedBy column if it doesn't exist
        if (!tableInfo.bannedBy) {
          await queryInterface.addColumn('Users', 'bannedBy', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'Users',
              key: 'id'
            }
          }, { transaction });
          console.log('Added bannedBy column to Users table');
        }
        
        // Add bannedAt column if it doesn't exist
        if (!tableInfo.bannedAt) {
          await queryInterface.addColumn('Users', 'bannedAt', {
            type: Sequelize.DATE,
            allowNull: true
          }, { transaction });
          console.log('Added bannedAt column to Users table');
        }
        
        return Promise.resolve();
      } catch (error) {
        console.error('Migration error:', error);
        return Promise.reject(error);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // Remove columns in reverse order
        await queryInterface.removeColumn('Users', 'bannedAt', { transaction });
        await queryInterface.removeColumn('Users', 'bannedBy', { transaction });
        
        return Promise.resolve();
      } catch (error) {
        console.error('Rollback error:', error);
        return Promise.reject(error);
      }
    });
  }
}; 