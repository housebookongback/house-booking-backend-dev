const { db, sequelize } = require('../models');

// Import all seed files
const coreSeeds = require('./coreSeeds');
const verificationSeeds = require('./verificationSeeds');
const propertySeeds = require('./propertySeeds');
const hostSeeds = require('./hostSeeds');
const guestSeeds = require('./guestSeeds');
const bookingSeeds = require('./bookingSeeds');
const paymentSeeds = require('./paymentSeeds');
const reviewSeeds = require('./reviewSeeds');
const searchSeeds = require('./searchSeeds');
const communicationSeeds = require('./communicationSeeds');
const analyticsSeeds = require('./analyticsSeeds');
const systemSeeds = require('./systemSeeds');

async function seedAll() {
  try {
    console.log('🌱 Starting database seeding...');

    // Core models (Users, Roles)
    await coreSeeds();
    console.log('✅ Core models seeded');

    // Verification models
    await verificationSeeds();
    console.log('✅ Verification models seeded');

    // Host management models
    await hostSeeds();
    console.log('✅ Host models seeded');

    // Property related models
    await propertySeeds();
    console.log('✅ Property models seeded');

    // Guest management models
    await guestSeeds();
    console.log('✅ Guest models seeded');

    // Booking and pricing models
    await bookingSeeds();
    console.log('✅ Booking models seeded');

    // Payment related models
    await paymentSeeds();
    console.log('✅ Payment models seeded');

    // Review system models
    await reviewSeeds();
    console.log('✅ Review models seeded');

    // Search and discovery models
    await searchSeeds();
    console.log('✅ Search models seeded');

    // Communication models
    await communicationSeeds();
    console.log('✅ Communication models seeded');

    // Analytics models
    await analyticsSeeds();
    console.log('✅ Analytics models seeded');

    // System models
    await systemSeeds();
    console.log('✅ System models seeded');

    console.log('✅ All seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedAll();
}

module.exports = seedAll;