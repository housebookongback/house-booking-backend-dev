const { faker } = require('@faker-js/faker');
const { Payment, PayoutAccount } = require('../models');

async function seedPayment() {
  try {
    // Create sample payments
    await Payment.bulkCreate([
      {
        bookingId: 1, // Assuming first booking ID is 1
        amount: 2000,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'credit_card',
        transactionId: 'txn_123456',
        paymentDate: new Date('2024-03-01'),
        refundAmount: 0,
        refundDate: null
      },
      {
        bookingId: 2, // Assuming second booking ID is 2
        amount: 600,
        currency: 'USD',
        status: 'pending',
        paymentMethod: 'paypal',
        transactionId: 'txn_789012',
        paymentDate: null,
        refundAmount: 0,
        refundDate: null
      }
    ]);

    // Create payout accounts
    await PayoutAccount.bulkCreate([
      {
        userId: 2, // Assuming host user ID is 2
        type: 'bank_account',
        accountNumber: '****1234',
        routingNumber: '****5678',
        bankName: 'Chase Bank',
        accountHolderName: 'John Doe',
        isDefault: true,
        status: 'verified'
      },
      {
        userId: 2,
        type: 'paypal',
        email: 'host@example.com',
        isDefault: false,
        status: 'verified'
      }
    ]);

    console.log('✅ Payment models seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding payment models:', error);
    throw error;
  }
}

module.exports = seedPayment;

// Execute if called directly
// if (require.main === module) {
//   seedPayment();
// }