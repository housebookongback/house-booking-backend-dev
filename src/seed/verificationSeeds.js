const { faker } = require('@faker-js/faker');
const sequelize = require('../models').sequelize.models;

async function seedVerificationModels() {
  try {
    // Clean existing data
    await sequelize.Document.destroy({ where: {} });
    await sequelize.Verification.destroy({ where: {} });

    // Récupérer les IDs des utilisateurs existants
    const existingUsers = await sequelize.User.findAll({
      attributes: ['id']
    });
    const userIds = existingUsers.map(user => user.id);

    if (userIds.length === 0) {
      throw new Error('No users found. Please run user seeds first.');
    }

    // Seed Verifications
    const verifications = Array.from({ length: 10 }).map(() => ({
      userId: faker.helpers.arrayElement(userIds),
      type: faker.helpers.arrayElement(['email', 'phone', 'identity']),
      method: faker.helpers.arrayElement(['email', 'sms', 'document']),
      token: faker.string.uuid(),
      status: faker.helpers.arrayElement(['pending', 'verified', 'expired']),
      expiresAt: faker.date.future(),
      verifiedAt: faker.date.past(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await sequelize.Verification.bulkCreate(verifications);

    // Seed Documents with required fileType
    const documents = Array.from({ length: 10 }).map(() => ({
      userId: faker.helpers.arrayElement(userIds),
      type: faker.helpers.arrayElement(['passport', 'id_card', 'driver_license']),
      documentNumber: faker.string.alphanumeric(10),
      fileUrl: faker.image.url(),
      fileType: faker.helpers.arrayElement(['image/jpeg', 'image/png', 'application/pdf']), // Added required field
      fileSize: faker.number.int({ min: 1000, max: 5000000 }), // Added file size in bytes
      status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await sequelize.Document.bulkCreate(documents);

    console.log('Verification models seeded successfully');
  } catch (error) {
    console.error('Error seeding verification models:', error);
    throw error;
  }
}
// seedVerificationModels();
module.exports = seedVerificationModels;