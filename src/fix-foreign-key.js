/**
 * Restore foreign key constraint for Photos table
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

async function restoreForeignKey() {
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
    
    // Restore foreign key constraint
    console.log('Restoring foreign key constraint...');
    await queryInterface.sequelize.query(
      `ALTER TABLE "Photos" ADD CONSTRAINT "Photos_listingId_fkey" 
       FOREIGN KEY ("listingId") REFERENCES "Listings" ("id") 
       ON DELETE CASCADE ON UPDATE CASCADE`
    );
    console.log('Foreign key constraint restored successfully!');
  } catch (error) {
    console.error('Failed to restore foreign key constraint:', error);
  } finally {
    // Close connection
    await sequelize.close();
  }
  
  process.exit(0);
}

restoreForeignKey(); 