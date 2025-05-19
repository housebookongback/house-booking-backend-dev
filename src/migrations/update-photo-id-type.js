/**
 * Migration to update Photos table id column from INTEGER to TEXT
 */

const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First drop constraints
    try {
      // Get primary key constraint name
      const [constraints] = await queryInterface.sequelize.query(
        `SELECT conname
         FROM pg_constraint
         WHERE conrelid = '"Photos"'::regclass AND contype = 'p'`
      );
      
      const pkConstraint = constraints?.[0]?.conname;
      if (pkConstraint) {
        await queryInterface.sequelize.query(
          `ALTER TABLE "Photos" DROP CONSTRAINT "${pkConstraint}"`
        );
      }

      // Get foreign key constraints referencing Photos.id
      const [fkConstraints] = await queryInterface.sequelize.query(
        `SELECT conname
         FROM pg_constraint
         WHERE conrelid = '"Photos"'::regclass AND contype = 'f'`
      );
      
      for (const constraint of fkConstraints || []) {
        if (constraint?.conname) {
          await queryInterface.sequelize.query(
            `ALTER TABLE "Photos" DROP CONSTRAINT "${constraint.conname}"`
          );
        }
      }

      // Modify the column type
      await queryInterface.changeColumn('Photos', 'id', {
        type: DataTypes.TEXT,
        allowNull: false
      });

      // Re-add primary key constraint
      await queryInterface.addConstraint('Photos', {
        fields: ['id'],
        type: 'primary key',
        name: 'photos_pkey'
      });
      
      return Promise.resolve();
    } catch (error) {
      console.error('Migration error:', error);
      return Promise.reject(error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This would be destructive, so we don't provide a rollback
    console.log('Warning: No rollback provided for this migration as it would be destructive');
    return Promise.resolve();
  }
}; 