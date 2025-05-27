require('dotenv').config();
const { Sequelize } = require('sequelize');
const db = require('./src/models');

async function addSampleBookingsAndPayments() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();
    console.log('Connection established successfully.');

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

    // Create sample bookings and payments for each user
    for (const user of users) {
      // Skip if the user is the host of the listing
      if (user.id === listing.hostId) continue;

      // Generate 1-3 bookings per user
      const bookingsCount = Math.floor(Math.random() * 3) + 1;
      
      console.log(`Creating ${bookingsCount} bookings for user ${user.id} (${user.email})...`);
      
      for (let i = 0; i < bookingsCount; i++) {
        // Create random dates (past bookings)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60) - 10); // Random date in the past 10-70 days
        
        const endDate = new Date(startDate);
        const stayDuration = Math.floor(Math.random() * 7) + 1; // 1-7 days
        endDate.setDate(startDate.getDate() + stayDuration);
        
        // Calculate total price
        const totalPrice = listing.pricePerNight * stayDuration;
        
        // Create booking
        const booking = await db.Booking.create({
          listingId: listing.id,
          guestId: user.id,
          hostId: listing.hostId,
          checkIn: startDate,
          checkOut: endDate,
          numberOfGuests: Math.floor(Math.random() * 3) + 1,
          totalPrice: totalPrice,
          status: 'completed',
          paymentStatus: 'paid',
          isActive: true
        });
        
        // Create payment for the booking - follow the proper status transitions
        // First create with pending status
        const payment = await db.Payment.create({
          bookingId: booking.id,
          amount: totalPrice,
          currency: 'USD',
          paymentMethod: 'credit_card',
          status: 'pending', // Start with pending status
          isActive: true
        });
        
        // Then move to processing
        await payment.update({ status: 'processing' });
        
        // Finally move to completed
        await payment.update({ status: 'completed' });
        
        console.log(`  Created booking #${i+1} for $${totalPrice.toFixed(2)} (${startDate.toDateString()} - ${endDate.toDateString()})`);
      }
    }

    console.log('Sample bookings and payments created successfully!');
  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    process.exit();
  }
}

// Run the function
addSampleBookingsAndPayments(); 