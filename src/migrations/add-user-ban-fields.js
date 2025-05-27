/**
 * Migration to add ban-related fields to Users table
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // First check if columns already exist
        const tableInfo = await queryInterface.describeTable('Users', { transaction });
        
        // Add banReason column if it doesn't exist
        if (!tableInfo.banReason) {
          await queryInterface.addColumn('Users', 'banReason', {
            type: Sequelize.TEXT,
            allowNull: true
          }, { transaction });
          console.log('Added banReason column to Users table');
        }
        
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
        
        // Update status enum to include 'banned' if needed
        const statusInfo = tableInfo.status;
        // If status is an enum type and doesn't include 'banned'
        if (statusInfo && statusInfo.type.startsWith('ENUM') && !statusInfo.type.includes('banned')) {
          // Extract existing enum values
          const enumValues = statusInfo.type
            .match(/ENUM\('(.*)'\)/)[1]
            .split("','");
          
          if (!enumValues.includes('banned')) {
            enumValues.push('banned');
            
            // Alter the column to add the new enum value
            await queryInterface.changeColumn('Users', 'status', {
              type: Sequelize.ENUM(...enumValues),
              allowNull: false,
              defaultValue: 'active'
            }, { transaction });
            
            console.log('Updated status enum to include "banned" value');
          }
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
        await queryInterface.removeColumn('Users', 'banReason', { transaction });
        
        // Note: We're not reverting the status enum changes as it's complex
        // and could cause data loss if there are banned users
        
        return Promise.resolve();
      } catch (error) {
        console.error('Rollback error:', error);
        return Promise.reject(error);
      }
    });
  }
}; 