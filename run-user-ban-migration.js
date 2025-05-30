/**
 * Run the user ban fields migration
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const migration = require('./src/migrations/add-user-ban-fields');

async function runMigration() {
  // Create Sequelize instance
  const sequelize = new Sequelize(
    process.env.DATABASE_NAME,
    process.env.DATABASE_USERNAME,
    process.env.DATABASE_PASSWORD,
    {
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      dialect: 'postgres',
      logging: console.log
    }
  );

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Create queryInterface
    const queryInterface = sequelize.getQueryInterface();
    
    // Run migration
    console.log('Starting user ban fields migration...');
    await migration.up(queryInterface, Sequelize);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close connection
    await sequelize.close();
  }
  
  process.exit(0);
}

runMigration(); 