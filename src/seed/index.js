const db = require('../models');

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
    // Core models (Users, Roles)
    await coreSeeds();
    console.log('✅ Core models seeded');

    // Verification models
    await verificationSeeds();
    console.log('✅ Verification models seeded');

    // Host management models

    // Property related models
    await propertySeeds();
    console.log('✅ Property models seeded');

    // Booking-related models
    await seedBooking();
    console.log('✅ Booking models seeded');
    
    await hostSeeds();
    console.log('✅ Host models seeded');
    // Payment related models
    await paymentSeeds();
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
    console.error('❌ Error during seeding:', error);
    throw error; // Re-throw the error to properly handle it
  } finally {
    // Close the database connection
    await db.sequelize.close();
  }
}

// Only run seedAll if this file is being run directly
seedAll()

module.exports = seedAll;