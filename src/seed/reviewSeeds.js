const { faker } = require('@faker-js/faker');
const sequelize = require('../models').sequelize.models;

async function seedReviewModels() {
  try {
    // Clean existing data
    await sequelize.ReviewReport.destroy({ where: {} });
    await sequelize.ReviewResponse.destroy({ where: {} });
    await sequelize.Review.destroy({ where: {} });

    // Get bookings to ensure valid relationships
    const bookings = await sequelize.Booking.findAll({ 
      include: [
        { model: sequelize.User, as: 'guest' },
        { model: sequelize.User, as: 'host' }
      ]
    });

    if (!bookings.length) {
      throw new Error('No bookings found. Please seed bookings first.');
    }

    // Get moderators for review reports
    const moderators = await sequelize.User.findAll({
      include: [{
        model: sequelize.Role,
        as: 'roles',
        where: { name: 'admin' },
        through: sequelize.UserRoles
      }]
    });

    // Seed Reviews - Ensure unique bookingId
    const usedBookingIds = new Set();
    const reviews = [];
    
    for (let i = 0; i < 20 && usedBookingIds.size < bookings.length; i++) {
      const booking = faker.helpers.arrayElement(bookings);
      
      // Skip if this booking already has a review
      if (usedBookingIds.has(booking.id)) {
        continue;
      }
      
      usedBookingIds.add(booking.id);
      reviews.push({
        bookingId: booking.id,
        reviewerId: booking.guestId,
        reviewedId: booking.hostId,
        listingId: booking.listingId,
        type: 'guest',
        rating: faker.number.int({ min: 1, max: 5 }),
        cleanliness: faker.number.int({ min: 1, max: 5 }),
        communication: faker.number.int({ min: 1, max: 5 }),
        checkIn: faker.number.int({ min: 1, max: 5 }),
        accuracy: faker.number.int({ min: 1, max: 5 }),
        location: faker.number.int({ min: 1, max: 5 }),
        value: faker.number.int({ min: 1, max: 5 }),
        comment: faker.lorem.paragraph(),
        isPublic: faker.datatype.boolean(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const createdReviews = await sequelize.Review.bulkCreate(reviews);

    // Seed ReviewResponses
    const responses = createdReviews
      .filter(() => faker.datatype.boolean())
      .map(review => ({
        reviewId: review.id,
        hostId: review.reviewedId,
        content: faker.lorem.paragraph(),
        isPublic: true,
        editCount: 0,
        metadata: {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

    await sequelize.ReviewResponse.bulkCreate(responses);

    // Seed ReviewReports
    const reports = createdReviews
      .filter(() => faker.datatype.boolean())
      .map(review => ({
        reviewId: review.id,
        reporterId: faker.helpers.arrayElement(bookings).guestId,
        reason: faker.helpers.arrayElement([
          'inappropriate_content',
          'false_information',
          'spam',
          'hate_speech',
          'harassment',
          'other'
        ]),
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(['pending', 'under_review', 'resolved', 'dismissed']),
        resolution: faker.helpers.arrayElement(['removed', 'edited', 'no_action']),
        resolvedAt: faker.datatype.boolean() ? faker.date.past() : null,
        resolvedById: moderators.length ? faker.helpers.arrayElement(moderators).id : null,
        resolutionNotes: faker.lorem.paragraph(),
        metadata: {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

    await sequelize.ReviewReport.bulkCreate(reports);

    console.log('Review models seeded successfully');
  } catch (error) {
    console.error('Error seeding review models:', error);
    throw error;
  }
}

module.exports = seedReviewModels;

// // Execute if called directly
// if (require.main === module) {
//   seedReviewModels();
// }