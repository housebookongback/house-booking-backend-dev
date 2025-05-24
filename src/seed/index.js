const { db, sequelize } = require('../models');

// Import all seed files
const seedCore = require('./coreSeeds');
const seedProperty = require('./propertySeeds');
const seedBooking = require('./bookingSeeds');
const seedPayment = require('./paymentSeeds');
const seedReview = require('./reviewSeeds');
const seedSearch = require('./searchSeeds');
const seedCommunication = require('./communicationSeeds');
const seedAnalytics = require('./analyticsSeeds');
const seedSystem = require('./systemSeeds');

async function seedAll() {
  try {
    console.log('🌱 Starting database seeding...');

    // Core models first (Users, Roles, etc.)
    await seedCore();
    console.log('✅ Core models seeded');

    // Property-related models
    await seedProperty();
    console.log('✅ Property models seeded');

    // Booking-related models
    await seedBooking();
    console.log('✅ Booking models seeded');

    // Payment-related models
    await seedPayment();
    console.log('✅ Payment models seeded');

    // Review-related models
    await seedReview();
    console.log('✅ Review models seeded');

    // Search-related models
    await seedSearch();
    console.log('✅ Search models seeded');

    // Communication-related models
    await seedCommunication();
    console.log('✅ Communication models seeded');

    // Analytics-related models
    await seedAnalytics();
    console.log('✅ Analytics models seeded');

    // System-related models
    await seedSystem();
    console.log('✅ System models seeded');

    console.log('🎉 All models seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Execute if called directly
if (require.main === module) {
  seedAll()
    .then(() => {
      console.log('✨ Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedAll;