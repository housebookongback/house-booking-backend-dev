/**
 * Script to add a test booking with a specific ID for debugging
 * Run with: node add-test-booking.js [bookingId]
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');
const db = require('./src/models');

async function addTestBooking() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();
    console.log('Connection established successfully.');

    // Get ID from command line if provided
    const requestedId = process.argv[2] ? parseInt(process.argv[2]) : null;
    console.log(requestedId ? `Attempting to create booking with ID: ${requestedId}` : 'No specific ID requested, will use auto-increment');

    // Get all users
    const users = await db.User.findAll({
      attributes: ['id', 'name', 'email'],
      raw: true
    });

    if (!users.length) {
      console.log('No users found. Please run the user seeder first.');
      return;
    }

    console.log(`Found ${users.length} users.`);

    // Get or create a sample listing
    let listing = await db.Listing.findOne();
    
    if (!listing) {
      console.log('Creating a sample listing...');
      // Find a host user
      const hostUser = await db.User.findOne({
        include: [{
          model: db.Role,
          as: 'roles',
          where: { name: 'host' }
        }]
      });

      if (!hostUser) {
        // If no host user exists, use the first user and assign host role
        const firstUser = await db.User.findByPk(users[0].id);
        const hostRole = await db.Role.findOne({ where: { name: 'host' } });
        if (hostRole) {
          await firstUser.addRole(hostRole);
        }
      }

      const hostId = hostUser ? hostUser.id : users[0].id;

      // Create a sample listing
      listing = await db.Listing.create({
        title: 'Sample Luxury Villa',
        description: 'A beautiful villa for your vacation',
        pricePerNight: 150.00,
        maxGuests: 4,
        bedroomCount: 2,
        bathroomCount: 2,
        hostId: hostId,
        status: 'active',
        isActive: true
      });
    }

    console.log(`Using listing: ${listing.id} - ${listing.title}`);

    // Get a guest user different from host
    const guestUser = users.find(user => user.id !== listing.hostId);
    if (!guestUser) {
      console.log('No suitable guest user found. Please add more users.');
      return;
    }

    // Create dates for the booking
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 10); // 10 days from now
    
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 3); // 3-day stay
    
    // Calculate total price
    const totalPrice = listing.pricePerNight * 3;

    console.log(`Creating test booking for ${guestUser.name} (${guestUser.email})`);
    console.log(`Stay: ${checkIn.toDateString()} - ${checkOut.toDateString()}`);
    console.log(`Total price: $${totalPrice.toFixed(2)}`);

    // Create the booking
    let bookingData = {
      listingId: listing.id,
      guestId: guestUser.id,
      hostId: listing.hostId,
      checkIn,
      checkOut,
      numberOfGuests: 2,
      totalPrice,
      status: 'confirmed',
      paymentStatus: 'paid',
      isActive: true
    };

    let booking;
    
    // If specific ID was requested, use direct SQL insert to set the ID
    if (requestedId) {
      // First check if the ID already exists
      const existingBooking = await db.Booking.findByPk(requestedId);
      if (existingBooking) {
        console.log(`⚠️ Booking with ID ${requestedId} already exists. Cannot create duplicate.`);
        return;
      }

      // Use raw SQL to insert with specific ID
      await db.sequelize.query(
        `INSERT INTO "Bookings" (
          "id", "listingId", "guestId", "hostId", "checkIn", "checkOut", 
          "numberOfGuests", "totalPrice", "status", "paymentStatus", "isActive", 
          "createdAt", "updatedAt"
        ) VALUES (
          :id, :listingId, :guestId, :hostId, :checkIn, :checkOut,
          :numberOfGuests, :totalPrice, :status, :paymentStatus, :isActive,
          NOW(), NOW()
        )`,
        {
          replacements: {
            id: requestedId,
            listingId: bookingData.listingId,
            guestId: bookingData.guestId,
            hostId: bookingData.hostId,
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut,
            numberOfGuests: bookingData.numberOfGuests,
            totalPrice: bookingData.totalPrice,
            status: bookingData.status,
            paymentStatus: bookingData.paymentStatus,
            isActive: bookingData.isActive
          },
          type: db.sequelize.QueryTypes.INSERT
        }
      );
      
      booking = await db.Booking.findByPk(requestedId);
      console.log(`✅ Successfully created booking with requested ID: ${requestedId}`);
    } else {
      // Use normal Sequelize create method for auto-increment ID
      booking = await db.Booking.create(bookingData);
      console.log(`✅ Successfully created booking with ID: ${booking.id}`);
    }

    // Create payment for the booking
    const payment = await db.Payment.create({
      bookingId: booking.id,
      amount: totalPrice,
      currency: 'USD',
      paymentMethod: 'credit_card',
      status: 'completed',
      isActive: true
    });
    
    console.log(`Created payment of $${payment.amount} for booking #${booking.id}`);
    console.log('\nBooking created successfully! 🎉');
    console.log(`To view the booking details, go to: http://localhost:5173/bookings/${booking.id}`);
    
  } catch (error) {
    console.error('Error creating test booking:', error);
  } finally {
    process.exit();
  }
}

// Run the function
addTestBooking(); 