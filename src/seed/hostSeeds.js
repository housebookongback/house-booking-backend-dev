const { faker } = require('@faker-js/faker');
const db = require('../models');

async function seedHostModels() {
  // const transaction = await sequelize.transaction();
  
  try {
    // Clean existing data
    await db.HostProfile.destroy({ where: {}, force: true});
    await db.HostEarnings.destroy({ where: {}, force: true});
    await db.HostVerification.destroy({ where: {}, force: true});

    // Get users with host role
    const hostUsers = await db.User.findAll({
      include: [{
        model: db.Role,
        as: 'roles',
        where: { name: 'host' },
        through: db.UserRoles
      }]
    });

    if (hostUsers.length === 0) {
      await transaction.rollback();
      throw new Error('No users with "host" role found. Please run user seeds first.');
    }

    // Create host profiles with uniqueness check
    const hostProfiles = await Promise.all(hostUsers.map(async user => {
      const existingProfile = await db.HostProfile.findOne({
        where: { userId: user.id },
        paranoid: false
      });

      if (!existingProfile) {
        return {
          userId: user.id,
          displayName: `${user.firstName || 'Host'}'s Hosting`,
          bio: faker.lorem.paragraph(),
          phoneNumber: faker.phone.number(),
          preferredLanguage: 'en',
          responseTime: faker.number.int({ min: 1, max: 24 }),
          responseRate: faker.number.float({ min: 0, max: 100 }),
          isSuperhost: faker.datatype.boolean(),
          verificationStatus: faker.helpers.arrayElement(['unverified', 'pending', 'verified', 'rejected']),
          verificationDocuments: {},
          notificationPreferences: {
            email: true,
            sms: false,
            push: true,
            bookingRequests: true,
            messages: true,
            reviews: true,
            updates: true
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
      return null;
    }));

    const validHostProfiles = hostProfiles.filter(profile => profile !== null);
    const createdHostProfiles = await db.HostProfile.bulkCreate(validHostProfiles, {
      returning: true
    });

    // Create host verifications
    const hostVerifications = [];
    for (const hostProfile of createdHostProfiles) {
      const verificationTypes = ['identity', 'address', 'phone', 'email', 'government_id'];
      
      for (const type of verificationTypes) {
        if (faker.datatype.boolean()) {
          hostVerifications.push({
            hostId: hostProfile.userId,
            type,
            status: faker.helpers.arrayElement(['pending', 'verified', 'rejected', 'expired']),
            documents: {
              fileUrl: faker.image.url(),
              fileName: `${type}_verification_${faker.string.alphanumeric(8)}`,
              fileType: faker.helpers.arrayElement(['image/jpeg', 'image/png', 'application/pdf']),
              uploadedAt: faker.date.past()
            },
            verifiedAt: faker.datatype.boolean() ? faker.date.past() : null,
            verifiedById: faker.datatype.boolean() ? faker.number.int({ min: 1, max: 10 }) : null,
            rejectedAt: faker.datatype.boolean() ? faker.date.past() : null,
            rejectedById: faker.datatype.boolean() ? faker.number.int({ min: 1, max: 10 }) : null,
            rejectionReason: faker.datatype.boolean() ? faker.lorem.sentence() : null,
            expiresAt: faker.date.future(),
            metadata: {
              submittedFrom: faker.helpers.arrayElement(['web', 'mobile', 'admin']),
              ipAddress: faker.internet.ip(),
              deviceInfo: {
                userAgent: faker.internet.userAgent(),
                platform: faker.helpers.arrayElement(['iOS', 'Android', 'Web'])
              }
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    }

    if (hostVerifications.length > 0) {
      await db.HostVerification.bulkCreate(hostVerifications, {
        validate: false
      });
    }

    // Create earnings (even without bookings)
    const hostEarnings = [];
    for (const hostProfile of createdHostProfiles) {
      // Créer d'abord un listing factice pour chaque hôte
      const dummyListing = await db.Listing.create({
        hostId: hostProfile.userId,
        title: faker.lorem.words(3),
        description: faker.lorem.paragraph(),
        status: 'published',  // Always use draft for seeds to avoid validation requirements
        minimumNights: 1,
        maximumNights: 1,
        cancellationPolicy: 'moderate',
        isActive: true,
        instantBookable: false,
        views: 0,
        reviewCount: 0,
        stepStatus: {
          basicInfo: false,
          location: false,
          details: false,
          pricing: false,
          photos: false,
          rules: false,
          calendar: false
        },
        defaultAvailability: true,
        checkInDays: [0,1,2,3,4,5,6],
        checkOutDays: [0,1,2,3,4,5,6],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Créer une réservation factice avec le listing créé
      const dummyBooking = await db.Booking.create({
        listingId: dummyListing.id,
        guestId: hostProfile.userId, // Utiliser l'ID de l'hôte comme invité pour simplifier
        hostId: hostProfile.userId,
        checkIn: faker.date.past(),
        checkOut: faker.date.future(),
        totalPrice: faker.number.float({ min: 100, max: 1000 }),
        status: 'completed',
        paymentStatus: 'paid',
        numberOfGuests: faker.number.int({ min: 1, max: 5 }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const numEarnings = faker.number.int({ min: 2, max: 5 });
      
      for (let i = 0; i < numEarnings; i++) {
        hostEarnings.push({
          hostProfileId: hostProfile.id,
          bookingId: dummyBooking.id,
          amount: faker.number.float({ min: 50, max: 1000, precision: 0.01 }),
          currency: 'USD',
          type: faker.helpers.arrayElement(['cleaning_fee', 'security_deposit', 'damage_fee', 'late_checkout', 'extra_guest']),
          status: faker.helpers.arrayElement(['pending', 'processing', 'paid', 'failed', 'refunded']),
          paymentMethod: faker.helpers.arrayElement(['bank_transfer', 'paypal', 'stripe', 'other']),
          paymentDetails: {
            transactionId: faker.string.alphanumeric(20),
            provider: faker.helpers.arrayElement(['bank', 'paypal', 'stripe']),
          },
          processedAt: faker.date.past(),
          paidAt: faker.date.past(),
          notes: faker.lorem.sentence(),
          metadata: {
            reason: 'Earning with dummy booking',
            platformFee: faker.number.float({ min: 5, max: 50, precision: 0.01 })
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    if (hostEarnings.length > 0) {
      await db.HostEarnings.bulkCreate(hostEarnings, {
        validate: false
      });
    }

    // await transaction.commit();
    console.log('Host db, verifications, and earnings seeded successfully');
  } catch (error) {
    // await transaction.rollback();
    console.error('Error seeding host db:', error);
    throw error;
  }
}

async function getAllHostProfiles() {
  try {
    const hostProfiles = await db.HostProfile.findAll({
      include: [
        { model: db.HostVerification },
        { model: db.HostEarnings }
      ]
    });
    console.log('All Host Profiles:', JSON.stringify(hostProfiles, null, 2));
  } catch (error) {
    console.error('Error fetching host profiles:', error);
  }
}

seedHostModels();
module.exports = seedHostModels;
