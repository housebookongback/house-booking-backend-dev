const { faker } = require('@faker-js/faker');
const db = require('../models');

async function seedHostModels() {
  try {
    // Clean existing data for earnings and verifications only
    await db.HostEarnings.destroy({ where: {}, force: true});
    await db.HostVerification.destroy({ where: {}, force: true});

    // Get existing host profiles and bookings
    const hostProfiles = await db.HostProfile.findAll();
    const bookings = await db.Booking.findAll();

    if (hostProfiles.length === 0) {
      throw new Error('No host profiles found. Please ensure host profiles are seeded first.');
    }

    if (bookings.length === 0) {
      throw new Error('No bookings found. Please seed bookings first.');
    }

    // Create host earnings
    const hostEarnings = [];
    for (const booking of bookings) {
      const hostProfile = hostProfiles.find(profile => profile.userId === booking.hostId);
      if (hostProfile) {
        hostEarnings.push({
          hostProfileId: hostProfile.id,
          bookingId: booking.id,
          amount: booking.totalPrice * 0.85, // 85% of booking price goes to host
          currency: 'USD',
          type: 'booking',
          status: faker.helpers.arrayElement(['pending', 'processing', 'paid']),
          paymentMethod: faker.helpers.arrayElement(['bank_transfer', 'paypal', 'stripe']),
          paymentDetails: {
            transactionId: faker.string.alphanumeric(20)
          },
          notes: faker.lorem.sentence(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Add cleaning fee earning
        hostEarnings.push({
          hostProfileId: hostProfile.id,
          bookingId: booking.id,
          amount: faker.number.float({ min: 20, max: 100 }),
          currency: 'USD',
          type: 'cleaning_fee',
          status: faker.helpers.arrayElement(['pending', 'processing', 'paid']),
          paymentMethod: faker.helpers.arrayElement(['bank_transfer', 'paypal', 'stripe']),
          paymentDetails: {
            transactionId: faker.string.alphanumeric(20)
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await db.HostEarnings.bulkCreate(hostEarnings);

    // Create host verifications
    const hostVerifications = hostProfiles.flatMap(hostProfile => {
      const verificationTypes = ['identity', 'address', 'phone', 'email', 'government_id'];
      return verificationTypes.map(type => ({
        hostId: hostProfile.userId,
        type,
        status: faker.helpers.arrayElement(['pending', 'verified', 'rejected']),
        documents: {
          fileUrl: faker.image.url(),
          fileName: `${type}_verification.pdf`,
          uploadedAt: faker.date.past()
        },
        verifiedAt: faker.date.past(),
        verifiedById: hostProfile.userId, // Using the host's own ID as verifier
        expiresAt: faker.date.future(),
        metadata: {
          verificationMethod: 'document_upload',
          verificationProvider: 'internal'
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    });

    await db.HostVerification.bulkCreate(hostVerifications);

    console.log('Host earnings and verifications seeded successfully');
  } catch (error) {
    console.error('Error seeding host models:', error);
    throw error;
  }
}
// seedHostModels()
module.exports = seedHostModels;