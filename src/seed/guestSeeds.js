const { faker } = require('@faker-js/faker');
const sequelize = require('../models').sequelize;

async function seedGuestModels() {
  const transaction = await sequelize.transaction(); // Start a transaction
  try {
    // Clean existing data within transaction
    await sequelize.models.GuestVerification.destroy({ where: {}, transaction });
    await sequelize.models.GuestPreferences.destroy({ where: {}, transaction });
    await sequelize.models.GuestProfile.destroy({ where: {}, transaction });

    // Fetch existing user IDs
    const existingUsers = await sequelize.models.User.findAll({
      attributes: ['id'],
      transaction,
    });
    const userIds = existingUsers.map((user) => user.id);

    if (userIds.length === 0) {
      throw new Error('No users found. Please run the user seed first.');
    }

    // Ensure we don't create more profiles than available users
    const numProfiles = Math.min(10, userIds.length);
    const availableUserIds = [...userIds]; // Copy of userIds to avoid duplicates
    const guestProfiles = Array.from({ length: numProfiles }).map(() => {
      if (availableUserIds.length === 0) {
        throw new Error('Not enough unique user IDs available.');
      }
      // Select and remove a random userId
      const randomIndex = faker.number.int({
        min: 0,
        max: availableUserIds.length - 1,
      });
      const userId = availableUserIds.splice(randomIndex, 1)[0];

      return {
        userId,
        displayName: faker.person.fullName(),
        bio: faker.lorem.paragraph(),
        nationality: faker.location.country(),
        dateOfBirth: faker.date.past({ years: 30 }),
        preferredLanguage: 'en',
        preferredCurrency: 'USD',
        isVerified: false,
        verificationStatus: 'pending',
        verificationDocuments: {},
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
          privacy: {
            showProfile: true,
            showReviews: true,
          },
        },
        metadata: {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const createdGuestProfiles = await sequelize.models.GuestProfile.bulkCreate(
      guestProfiles,
      { transaction }
    );

    // Seed GuestPreferences
    const guestPreferences = createdGuestProfiles.map((guest) => ({
      guestProfileId: guest.id,
      notifications: {
        email: {
          bookingConfirmation: true,
          bookingReminder: true,
          reviewRequest: true,
          specialOffers: true,
          newsletter: false,
        },
        sms: {
          bookingConfirmation: true,
          bookingReminder: true,
          urgentAlerts: true,
        },
        push: {
          bookingUpdates: true,
          messages: true,
          deals: false,
        },
      },
      privacy: {
        showProfile: true,
        showReviews: true,
        showBookings: false,
        showWishlist: true,
        showSocialLinks: false,
      },
      searchPreferences: {
        priceRange: { min: 0, max: 1000 },
        propertyTypes: [],
        amenities: [],
        locations: [],
        instantBook: false,
        superhostOnly: false,
      },
      stayPreferences: {
        checkInTime: '15:00',
        checkOutTime: '11:00',
        smoking: false,
        pets: false,
        accessibility: [],
        houseRules: [],
      },
      communicationPreferences: {
        language: 'en',
        timezone: 'UTC',
        responseTime: 'within_24_hours',
        autoTranslate: true,
      },
      paymentPreferences: {
        currency: 'USD',
        paymentMethods: [],
        autoPay: false,
        savePaymentInfo: false,
      },
      metadata: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await sequelize.models.GuestPreferences.bulkCreate(guestPreferences, {
      transaction,
    });

    // Seed GuestVerifications
    const guestVerifications = createdGuestProfiles.map((guest) => ({
      guestProfileId: guest.id,
      documentType: faker.helpers.arrayElement(['passport', 'id_card', 'drivers_license', 'other']),
      documentNumber: faker.string.alphanumeric(10),
      documentUrl: faker.internet.url(),
      status: faker.helpers.arrayElement(['pending', 'verified', 'rejected']),
      verifiedAt: faker.date.past(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await sequelize.models.GuestVerification.bulkCreate(guestVerifications, {
      transaction,
    });

    // Commit the transaction
    await transaction.commit();
    console.log('Guest models seeded successfully');
  } catch (error) {
    // Roll back the transaction on error
    await transaction.rollback();
    console.error('Error seeding guest models:', error);
    throw error;
  }
}
// seedGuestModels();
module.exports = seedGuestModels;