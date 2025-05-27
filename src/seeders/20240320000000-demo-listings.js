'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, ensure we have a test user
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" LIMIT 1;`
    );
    
    if (users.length === 0) {
      throw new Error('No users found. Please run user seeder first.');
    }
    
    const userId = users[0].id;

    // Get or create a location
    const [locations] = await queryInterface.sequelize.query(
      `SELECT id FROM "Locations" LIMIT 1;`
    );
    
    let locationId;
    if (locations.length === 0) {
      const [newLocation] = await queryInterface.bulkInsert('Locations', [{
        name: 'Paris',
        slug: 'paris',
        createdAt: new Date(),
        updatedAt: new Date()
      }], { returning: true });
      locationId = newLocation.id;
    } else {
      locationId = locations[0].id;
    }

    // Get or create a category
    const [categories] = await queryInterface.sequelize.query(
      `SELECT id FROM "Categories" LIMIT 1;`
    );
    
    let categoryId;
    if (categories.length === 0) {
      const [newCategory] = await queryInterface.bulkInsert('Categories', [{
        name: 'Apartment',
        slug: 'apartment',
        createdAt: new Date(),
        updatedAt: new Date()
      }], { returning: true });
      categoryId = newCategory.id;
    } else {
      categoryId = categories[0].id;
    }

    // Create test listings
    const listings = [
      {
        title: 'Cozy Paris Apartment',
        slug: 'cozy-paris-apartment',
        description: 'Beautiful apartment in the heart of Paris',
        hostId: userId,
        categoryId: categoryId,
        locationId: locationId,
        accommodates: 4,
        bedrooms: 2,
        beds: 3,
        bathrooms: 1.5,
        pricePerNight: 150.00,
        cleaningFee: 50.00,
        securityDeposit: 200.00,
        minimumNights: 2,
        maximumNights: 14,
        cancellationPolicy: 'moderate',
        status: 'published',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        title: 'Luxury Paris Loft',
        slug: 'luxury-paris-loft',
        description: 'Spacious loft with amazing city views',
        hostId: userId,
        categoryId: categoryId,
        locationId: locationId,
        accommodates: 6,
        bedrooms: 3,
        beds: 4,
        bathrooms: 2,
        pricePerNight: 300.00,
        cleaningFee: 75.00,
        securityDeposit: 400.00,
        minimumNights: 3,
        maximumNights: 30,
        cancellationPolicy: 'strict',
        status: 'published',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert listings
    await queryInterface.bulkInsert('Listings', listings);

    // Get the inserted listings to add photos
    const [insertedListings] = await queryInterface.sequelize.query(
      `SELECT id FROM "Listings" WHERE slug IN ('cozy-paris-apartment', 'luxury-paris-loft');`
    );

    // Add photos for each listing
    const photos = [];
    for (const listing of insertedListings) {
      photos.push(
        {
          listingId: listing.id,
          url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
          isCover: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          listingId: listing.id,
          url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
          isCover: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }

    await queryInterface.bulkInsert('Photos', photos);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove photos first (due to foreign key constraint)
    await queryInterface.bulkDelete('Photos', null, {});
    // Then remove listings
    await queryInterface.bulkDelete('Listings', null, {});
  }
}; 