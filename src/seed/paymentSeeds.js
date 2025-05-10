const { faker } = require('@faker-js/faker');
const sequelize = require('../models').sequelize.models;

async function seedPaymentModels() {
  try {
    // Clean existing data
    await sequelize.Payment.destroy({ where: {} });
    await sequelize.PayoutAccount.destroy({ where: {} });

    // Get some bookings to associate payments with
    const bookings = await sequelize.Booking.findAll({ limit: 10 });
    
    if (!bookings.length) {
      console.log('No bookings found. Please seed bookings first.');
      return;
    }

    // Get host profiles for payout accounts
    const hostProfiles = await sequelize.HostProfile.findAll();
    
    if (!hostProfiles.length) {
      console.log('No host profiles found. Please seed hosts first.');
      return;
    }

    // Seed Payments
    const payments = Array.from({ length: 20 }).map(() => {
      const booking = faker.helpers.arrayElement(bookings);
      return {
        bookingId: booking.id,
        amount: faker.number.float({ min: 50, max: 1000, precision: 0.01 }),
        currency: faker.helpers.arrayElement(['USD', 'EUR', 'GBP']),
        paymentMethod: faker.helpers.arrayElement(['credit_card', 'bank_transfer', 'paypal', 'stripe']),
        paymentDetails: {
          transactionId: faker.string.alphanumeric(20),
          provider: faker.helpers.arrayElement(['visa', 'mastercard', 'paypal', 'stripe']),
          last4: faker.finance.creditCardNumber('####'),
        },
        idempotencyKey: faker.string.uuid(),
        status: faker.helpers.arrayElement(['pending', 'processing', 'completed', 'failed', 'refunded', 'disputed']),
        processedAt: faker.date.past(),
        completedAt: faker.date.past(),
        metadata: {
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    await sequelize.Payment.bulkCreate(payments);

    // Seed PayoutAccounts
    const payoutAccounts = hostProfiles.map(host => {
      const accountType = faker.helpers.arrayElement(['bank_account', 'paypal', 'stripe']);
      let accountDetails;

      switch (accountType) {
        case 'bank_account':
          accountDetails = {
            bankName: faker.company.name(),
            accountNumber: faker.finance.accountNumber(),
            routingNumber: faker.finance.routingNumber(),
            accountHolderName: faker.person.fullName(),
            accountType: faker.helpers.arrayElement(['checking', 'savings'])
          };
          break;
        case 'paypal':
          accountDetails = {
            email: faker.internet.email(),
            accountId: faker.string.alphanumeric(16),
            accountStatus: 'verified'
          };
          break;
        case 'stripe':
          accountDetails = {
            accountId: `acct_${faker.string.alphanumeric(16)}`,
            accountStatus: 'verified',
            country: faker.location.countryCode(),
            currency: faker.finance.currencyCode()
          };
          break;
      }

      return {
        hostProfileId: host.id,
        accountType,
        accountDetails,
        isDefault: true,
        isVerified: faker.datatype.boolean(),
        verificationStatus: faker.helpers.arrayElement(['pending', 'verified', 'rejected']),
        verificationDocuments: accountType === 'bank_account' ? {
          proofOfAccount: faker.system.filePath(),
          identityDocument: faker.system.filePath()
        } : null,
        lastUsedAt: faker.date.past(),
        metadata: {
          createdFrom: faker.helpers.arrayElement(['web', 'mobile', 'api']),
          ipAddress: faker.internet.ip()
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    await sequelize.PayoutAccount.bulkCreate(payoutAccounts);

    console.log('Payment and PayoutAccount models seeded successfully');
  } catch (error) {
    console.error('Error seeding payment models:', error);
    throw error;
  }
}

module.exports = seedPaymentModels;

// Execute if called directly
// if (require.main === module) {
//   seedPaymentModels();
// }