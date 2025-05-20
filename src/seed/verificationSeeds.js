const { faker } = require('@faker-js/faker');
const db = require('../models')

async function seedVerificationModels() {
  try {
    // Clean existing data
    await db.Document.destroy({ where: {} });
    await db.Verification.destroy({ where: {} });
    await db.HostProfile.destroy({ where: {} });

    // Récupérer les IDs des utilisateurs existants
    const existingUsers = await db.User.findAll({
      attributes: ['id']
    });
    const userIds = existingUsers.map(user => user.id);

    if (userIds.length === 0) {
      throw new Error('No users found. Please run user seeds first.');
    }

    // Seed Host Profiles
    const usedUserIds = new Set(); // Pour suivre les IDs déjà utilisés
    const hostProfiles = Array.from({ length: 5 }).map(() => {
      let userId;
      // Trouver un userId non utilisé
      do {
        userId = faker.helpers.arrayElement(userIds);
      } while (usedUserIds.has(userId));
      
      usedUserIds.add(userId);

      return {
        userId,
        displayName: faker.person.fullName(),
        bio: faker.lorem.paragraph(),
        profilePicture: faker.image.avatar(),
        phoneNumber: faker.phone.number('+1##########'),
        preferredLanguage: faker.helpers.arrayElement(['en', 'es', 'fr', 'de', 'it']),
        responseTime: faker.number.int({ min: 1, max: 24 }),
        responseRate: faker.number.float({ min: 70, max: 100, precision: 0.01 }),
        isSuperhost: faker.datatype.boolean(),
        superhostSince: faker.date.past(),
        verificationStatus: faker.helpers.arrayElement(['unverified', 'pending', 'verified', 'rejected']),
        verificationDocuments: {},
        notificationPreferences: {
          email: faker.datatype.boolean(),
          sms: faker.datatype.boolean(),
          push: faker.datatype.boolean(),
          bookingRequests: faker.datatype.boolean(),
          messages: faker.datatype.boolean(),
          reviews: faker.datatype.boolean(),
          updates: faker.datatype.boolean()
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    await db.HostProfile.bulkCreate(hostProfiles);

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

    await db.Verification.bulkCreate(verifications);

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

    await db.Document.bulkCreate(documents);

    console.log('Verification models and host profiles seeded successfully');
  } catch (error) {
    console.error('Error seeding verification models:', error);
    throw error;
  }
}
// seedVerificationModels();
module.exports = seedVerificationModels;