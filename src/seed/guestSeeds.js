const { faker } = require('@faker-js/faker');
const db = require('../models')

async function seedGuestModels() {
  try {
    // Clean existing data within transaction
    await db.GuestVerification.destroy({ where: {} });
    await db.GuestPreferences.destroy({ where: {} });
    await db.GuestProfile.destroy({ where: {} });

    // Fetch existing user IDs
    const existingUsers = await db.User.findAll({
      attributes: ['id'],
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

    const createdGuestProfiles = await db.GuestProfile.bulkCreate(
      guestProfiles,

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

    await db.GuestPreferences.bulkCreate(guestPreferences, {
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

    await db.GuestVerification.bulkCreate(guestVerifications, {
    });

    // Commit the transaction
    // await transaction.commit();
    console.log('Guest models seeded successfully');
  } catch (error) {
    // Roll back the transaction on error
    // await transaction.rollback();
    console.error('Error seeding guest models:', error);
    throw error;
  }
}
// seedGuestModels();
module.exports = seedGuestModels;