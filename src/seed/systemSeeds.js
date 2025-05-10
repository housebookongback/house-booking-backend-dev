const { faker } = require('@faker-js/faker');
const sequelize = require('../models').sequelize.models;

async function seedSystemModels() {
  try {
    // Clean existing data
    await sequelize.SystemSetting.destroy({ where: {} });
    await sequelize.Maintenance.destroy({ where: {} });
    await sequelize.Report.destroy({ where: {} });

    // Seed SystemSettings avec des clés uniques
    const systemSettings = [
      {
        key: 'app_platform_name',  // Modifié pour être unique
        value: JSON.stringify('House Booking Platform'),
        type: 'string',
        description: 'Platform name',
        category: 'general',
        isPublic: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        key: 'app_maintenance_window',  // Modifié pour être unique
        value: JSON.stringify({
          start: '02:00',
          end: '04:00',
          timezone: 'UTC'
        }),
        type: 'json',
        description: 'System maintenance window',
        category: 'system',
        isPublic: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await sequelize.SystemSetting.bulkCreate(systemSettings, { ignoreDuplicates: true });

    // Get admin user for maintenance records
    const adminUser = await sequelize.User.findOne({
      include: [{
        model: sequelize.Role,
        as: 'roles',
        where: { name: 'admin' }
      }]
    });

    if (!adminUser) {
      throw new Error('No admin user found. Please seed users first.');
    }

    // Seed Maintenance records
    const maintenanceRecords = Array.from({ length: 5 }).map(() => {
      const startTime = faker.date.future();
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + faker.number.int({ min: 1, max: 4 }));

      return {
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        startTime,
        endTime,
        status: faker.helpers.arrayElement(['scheduled', 'in_progress', 'completed', 'cancelled']),
        type: faker.helpers.arrayElement(['system', 'database', 'security', 'feature', 'other']),
        impact: faker.helpers.arrayElement(['none', 'low', 'medium', 'high', 'critical']),
        affectedServices: JSON.stringify(['booking', 'payment', 'messaging'].slice(0, faker.number.int({ min: 1, max: 3 }))),
        createdById: adminUser.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    await sequelize.Maintenance.bulkCreate(maintenanceRecords);

    // Get users and listings for reports
    const users = await sequelize.User.findAll();
    const listings = await sequelize.Listings.scope('all').findAll({ raw: true });

    if (!users.length || !listings.length) {
      throw new Error('No users or listings found. Please seed users and listings first.');
    }

    // Seed Reports
    const reports = Array.from({ length: 10 }).map(() => {
      const reporter = faker.helpers.arrayElement(users);
      const reportedUser = faker.helpers.arrayElement(users.filter(u => u.id !== reporter.id));
      const listing = faker.helpers.arrayElement(listings);
      const type = faker.helpers.arrayElement(['listing', 'user']);

      return {
        type,
        reason: faker.helpers.arrayElement([
          'inappropriate_content',
          'fake_listing',
          'scam',
          'harassment',
          'spam',
          'other'
        ]),
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(['pending', 'under_review', 'resolved', 'dismissed']),
        reporterId: reporter.id,
        reportedUserId: type === 'user' ? reportedUser.id : null,
        listingId: type === 'listing' ? listing.id : null,
        resolvedById: faker.datatype.boolean() ? adminUser.id : null,
        resolution: null,
        resolvedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    await sequelize.Report.bulkCreate(reports);

    console.log('System models seeded successfully');
  } catch (error) {
    console.error('Error seeding system models:', error);
    throw error;
  }
}

// Only call the seed function if this file is run directly
// if (require.main === module) {
//   seedSystemModels()
//     .then(() => process.exit(0))
//     .catch((error) => {
//       console.error('Failed to seed system models:', error);
//       process.exit(1);
//     });
// }

module.exports = seedSystemModels;