const { faker } = require('@faker-js/faker');
const sequelize = require('../models').sequelize;

async function seedBookingModels() {
  const transaction = await sequelize.transaction();
  try {
    // Clean existing data
    await sequelize.models.BookingCalendar.destroy({ where: {}, transaction });
    await sequelize.models.BookingCancellation.destroy({ where: {}, transaction });
    await sequelize.models.BookingChange.destroy({ where: {}, transaction });
    await sequelize.models.BookingRequest.destroy({ where: {}, transaction });
    await sequelize.models.Booking.destroy({ where: {}, transaction });
    await sequelize.models.PriceRule.destroy({ where: {}, transaction });
    await sequelize.models.SeasonalPricing.destroy({ where: {}, transaction });

    // Fetch existing listings, guests, and hosts
    const listings = await sequelize.models.Listings.scope('all').findAll({ raw: true });
    if (listings.length === 0) {
      throw new Error('No listings found. Please ensure listings are seeded before running booking seeds.');
    }

    const guests = await sequelize.models.User.findAll({
      include: [{ model: sequelize.models.GuestProfile, as: 'guestProfile', required: true }],
      attributes: ['id'],
      raw: true,
      transaction
    });

    const hosts = await sequelize.models.User.findAll({
      include: [{ model: sequelize.models.HostProfile, as: 'hostProfile', required: false }],
      attributes: ['id'],
      transaction
    });
    const listingIds = listings.map((l) => l.id);
    const guestIds = guests.map((g) => g.id);
    const hostIds = hosts.map((h) => h.id);

    if (!listingIds.length || !guestIds.length || !hostIds.length) {
      throw new Error('No listings, guests, or hosts found. Please run the respective seeds first.');
    }

    const priceRules = Array.from({ length: 10 }).map(() => ({
      listingId: faker.helpers.arrayElement(listingIds),
      name: faker.lorem.words(2),
      type: faker.helpers.arrayElement(['last_minute', 'early_bird', 'length_of_stay']),
      adjustmentValue: faker.number.float({ min: 0.05, max: 0.3 }),
      startDate: faker.date.future(),
      endDate: faker.date.future(),
      adjustmentType: 'percentage',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await sequelize.models.PriceRule.bulkCreate(priceRules, { transaction });

    const seasonalPricing = Array.from({ length: 10 }).map(() => ({
      listingId: faker.helpers.arrayElement(listingIds),
      name: faker.lorem.words(2),
      startDate: faker.date.future(),
      endDate: faker.date.future(),
      priceMultiplier: faker.number.float({ min: 1.1, max: 2.0 }),
      adjustmentType: 'percentage',
      adjustmentValue: faker.number.float({ min: 0.1, max: 0.5 }), // Ajout de adjustmentValue
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await sequelize.models.SeasonalPricing.bulkCreate(seasonalPricing, { transaction });

    const bookings = [];
    for (let i = 0; i < 10; i++) {
      const checkIn = faker.date.future();
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + faker.number.int({ min: 1, max: 14 }));
      
      bookings.push({
        listingId: faker.helpers.arrayElement(listingIds),
        guestId: faker.helpers.arrayElement(guestIds),
        hostId: faker.helpers.arrayElement(hostIds),
        checkIn,
        checkOut,
        totalPrice: faker.number.float({ min: 100, max: 1000 }),
        status: faker.helpers.arrayElement(['pending', 'confirmed', 'cancelled', 'completed']),
        paymentStatus: faker.helpers.arrayElement(['pending', 'paid', 'refunded', 'failed']),
        numberOfGuests: faker.number.int({ min: 1, max: 5 }),
        specialRequests: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        cancellationReason: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    const createdBookings = await sequelize.models.Booking.bulkCreate(bookings, { transaction });

    // Create booking requests
    const bookingRequests = createdBookings
      .filter(() => faker.datatype.boolean())
      .map(booking => ({
        bookingId: booking.id,
        listingId: booking.listingId,
        guestId: booking.guestId,
        hostId: booking.hostId,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        totalPrice: booking.totalPrice,
        numberOfGuests: booking.numberOfGuests,
        message: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(['pending', 'approved', 'rejected', 'expired']),
        responseMessage: null,
        responseDate: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        refundAmount: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    await sequelize.models.BookingRequest.bulkCreate(bookingRequests, { transaction });

    // Create booking changes
    const bookingChanges = createdBookings
      .filter(() => faker.datatype.boolean())
      .map(booking => {
        const changeType = faker.helpers.arrayElement(['dates', 'guests', 'price', 'other']);
        const newCheckIn = faker.date.future();
        const newCheckOut = new Date(newCheckIn);
        newCheckOut.setDate(newCheckOut.getDate() + faker.number.int({ min: 1, max: 14 }));

        return {
          bookingId: booking.id,
          requestedBy: faker.helpers.arrayElement(['guest', 'host', 'system']),
          requestedById: faker.helpers.arrayElement([booking.guestId, booking.hostId]),
          changeType,
          oldCheckIn: changeType === 'dates' ? booking.checkIn : null,
          newCheckIn: changeType === 'dates' ? newCheckIn : null,
          oldCheckOut: changeType === 'dates' ? booking.checkOut : null,
          newCheckOut: changeType === 'dates' ? newCheckOut : null,
          oldNumberOfGuests: changeType === 'guests' ? booking.numberOfGuests : null,
          newNumberOfGuests: changeType === 'guests' ? faker.number.int({ min: 1, max: 5 }) : null,
          oldTotalPrice: changeType === 'price' ? booking.totalPrice : null,
          newTotalPrice: changeType === 'price' ? faker.number.float({ min: 100, max: 1000 }) : null,
          reason: faker.lorem.sentence(),
          status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
          changeDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

    await sequelize.models.BookingChange.bulkCreate(bookingChanges, { transaction });

    // Create booking cancellations
    const bookingCancellations = createdBookings
      .filter(booking => booking.status === 'cancelled')
      .map(booking => ({
        bookingId: booking.id,
        cancelledBy: faker.helpers.arrayElement(['guest', 'host', 'system']),
        cancelledById: faker.helpers.arrayElement([booking.guestId, booking.hostId, null]),
        reason: faker.lorem.sentence(),
        refundAmount: faker.number.float({ min: 0, max: booking.totalPrice }),
        cancellationFee: faker.number.float({ min: 10, max: 100 }),
        cancellationDate: new Date(),
        status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    await sequelize.models.BookingCancellation.bulkCreate(bookingCancellations, { transaction });

    // Create booking calendars for each listing
    const bookingCalendars = [];
    for (const listingId of listingIds) {
      // Create calendar entries for the next 90 days
      const startDate = new Date();
      for (let i = 0; i < 90; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        bookingCalendars.push({
          listingId,
          date,
          isAvailable: faker.datatype.boolean(),
          basePrice: faker.number.float({ min: 50, max: 500, precision: 0.01 }),
          minStay: faker.number.int({ min: 1, max: 3 }),
          maxStay: faker.number.int({ min: 7, max: 30 }),
          checkInAllowed: faker.datatype.boolean(),
          checkOutAllowed: faker.datatype.boolean(),
          notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
          metadata: {
            lastUpdatedBy: 'system',
            reason: 'initial_seed'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await sequelize.models.BookingCalendar.bulkCreate(bookingCalendars, { transaction });

    await transaction.commit();
    console.log('Booking models seeded successfully');
  } catch (error) {
    await transaction.rollback();
    console.error('Error seeding booking models:', error);
    throw error;
  }
}
// seedBookingModels()
module.exports = seedBookingModels;
