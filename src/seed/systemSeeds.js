const { faker } = require('@faker-js/faker');
const db = require('../models');

async function seedSystemModels() {
  try {
    // Clean existing data
    await db.SystemSetting.destroy({ where: {} });
    await db.Maintenance.destroy({ where: {} });
    await db.Report.destroy({ where: {} });
    await db.Photo.destroy({ where: {} });

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

    await db.SystemSetting.bulkCreate(systemSettings, { ignoreDuplicates: true });

    // Get admin user for maintenance records
    const adminUser = await db.User.findOne({
      include: [{
        model: db.Role,
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

    await db.Maintenance.bulkCreate(maintenanceRecords);

    // Get users and listings for reports
    const users = await db.User.findAll();
    const listings = await db.Listing.scope('all').findAll({ raw: true });

    if (!users.length || !listings.length) {
      throw new Error('No users or listings found. Please seed users and listings first.');
    }

    // Seed Reports
    const reports = Array.from({ length: 10 }).map(() => {
      const reporter = faker.helpers.arrayElement(users);
      const reportedUser = faker.helpers.arrayElement(users.filter(u => u.id !== reporter.id));
      const listing = faker.helpers.arrayElement(listings);  // Now using the correct 'listings' variable
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

    await db.Report.bulkCreate(reports);

    // Use the existing listings variable instead of declaring it again
    if (!listings.length) {
      throw new Error('No listings found. Please seed listings first.');
    }

    // Sample apartment photo URLs (using realistic apartment photo URLs)
    const apartmentPhotoUrls = [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267', // Living Room
      'https://images.unsplash.com/photo-1484154218962-a197022b5858', // Kitchen
      'https://images.unsplash.com/photo-1501876725168-00c445821c9e', // Bedroom
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a', // Bathroom
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb', // Dining Area
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750', // Exterior
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688', // Pool
      'https://images.unsplash.com/photo-1616137466211-f939a420be84', // Garden
    ];

    const photoCategories = [
      'exterior', 'interior', 'bedroom', 'bathroom', 'kitchen',
      'living_room', 'dining_room', 'garden', 'pool', 'view'
    ];

    // Seed Photos
    const photos = [];
    for (const listing of listings) {
      // Create 5-8 photos per listing
      const numPhotos = faker.number.int({ min: 5, max: 8 });
      
      for (let i = 0; i < numPhotos; i++) {
        const url = faker.helpers.arrayElement(apartmentPhotoUrls);
        const category = faker.helpers.arrayElement(photoCategories);
        
        photos.push({
          listingId: listing.id,
          url: url,
          thumbnailUrl: `${url}?w=300&fit=crop`, // Create thumbnail version
          fileType: 'image/jpeg',
          fileSize: faker.number.int({ min: 500000, max: 5000000 }), // 500KB to 5MB
          width: 1920,
          height: 1080,
          caption: faker.lorem.sentence(),
          category: category,
          tags: faker.helpers.arrayElements(['modern', 'spacious', 'bright', 'cozy', 'luxury'], 
            faker.number.int({ min: 1, max: 3 })),
          takenAt: faker.date.past(),
          isCover: i === 0, // First photo is cover
          displayOrder: i,
          status: 'approved',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await db.Photo.bulkCreate(photos);

    console.log('System models and photos seeded successfully');
  } catch (error) {
    console.error('Error seeding system models:', error);
    throw error;
  }
}
// seedSystemModels()
module.exports = seedSystemModels;