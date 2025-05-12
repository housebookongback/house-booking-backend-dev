const { faker } = require('@faker-js/faker');
const sequelize = require('../models').sequelize.models;

async function seedSearchModels() {
  try {
    // Clean existing data
    await sequelize.SearchHistory.destroy({ where: {} });
    await sequelize.SearchFilter.destroy({ where: {} });

    // Get valid users first
    const users = await sequelize.User.findAll();
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

    await sequelize.SearchFilter.bulkCreate(searchFilters);

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

    await sequelize.SearchHistory.bulkCreate(searchHistory);

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