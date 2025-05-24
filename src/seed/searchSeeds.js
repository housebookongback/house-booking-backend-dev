const { faker } = require('@faker-js/faker');
const { SearchFilter, SearchHistory, ViewCount, ClickCount } = require('../models');
const db = require('../models');

async function seedSearchModels() {
  try {
    // Clean existing data
    await db.SearchHistory.destroy({ where: {} });
    await db.SearchFilter.destroy({ where: {} });

    // Get valid users first
    const users = await db.User.findAll();
    if (!users.length) {
      throw new Error('No users found. Please seed users first.');
    }

    // Seed SearchFilters
    const searchFilters = Array.from({ length: 10 }).map(() => ({
      userId: faker.helpers.arrayElement(users).id,
      name: faker.lorem.words(2),
      filters: {
        priceRange: {
          min: faker.number.int({ min: 50, max: 200 }),
          max: faker.number.int({ min: 201, max: 1000 })
        },
        amenities: faker.helpers.arrayElements(['wifi', 'pool', 'parking', 'gym'], faker.number.int({ min: 1, max: 4 })),
        propertyType: faker.helpers.arrayElements(['apartment', 'house', 'villa'], faker.number.int({ min: 1, max: 3 }))
      },
      isDefault: false,
      lastUsedAt: null,
      useCount: 0,
      metadata: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await db.SearchFilter.bulkCreate(searchFilters);

    // Seed SearchHistory
    const searchHistory = Array.from({ length: 20 }).map(() => ({
      userId: faker.helpers.arrayElement(users).id,
      query: faker.lorem.words(3), // Changé de searchQuery à query pour correspondre au modèle
      filters: {
        location: faker.location.city(),
        dates: {
          checkIn: faker.date.future(),
          checkOut: faker.date.future()
        },
        guests: faker.number.int({ min: 1, max: 6 })
      },
      results: faker.number.int({ min: 0, max: 50 }),
      metadata: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await db.SearchHistory.bulkCreate(searchHistory);

    // Create view counts
    await ViewCount.bulkCreate([
      {
        listingId: 1, // Assuming first listing ID is 1
        userId: faker.helpers.arrayElement(users).id,
        viewDate: new Date(),
        source: 'search_results',
        deviceType: 'desktop'
      }
    ]);

    // Create click counts
    await ClickCount.bulkCreate([
      {
        listingId: 1,
        userId: faker.helpers.arrayElement(users).id,
        clickDate: new Date(),
        source: 'search_results',
        action: 'view_details'
      }
    ]);

    console.log('Search models seeded successfully');
  } catch (error) {
    console.error('Error seeding search models:', error);
    throw error;
  }
}
// seedSearchModels();
module.exports = seedSearchModels;

// Execute if called directly
// if (require.main === module) {
//   seedSearchModels();
// }