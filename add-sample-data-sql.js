require('dotenv').config();
const { Sequelize } = require('sequelize');
const db = require('./src/models');

async function addSampleDataWithSQL() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();
    console.log('Connection established successfully.');

    // Get all users
    const users = await db.sequelize.query(
      'SELECT id, name, email FROM "Users" LIMIT 20',
      { type: db.sequelize.QueryTypes.SELECT }
    );

    if (!users.length) {
      console.log('No users found. Please run the user seeder first.');
      return;
    }

    console.log(`Found ${users.length} users.`);

    // Get or create a sample listing
    let listing = await db.sequelize.query(
      'SELECT id, title, "hostId", "pricePerNight" FROM "Listings" LIMIT 1',
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    if (!listing.length) {
      console.log('Creating a sample listing...');
      // Use the first user as host
      const hostId = users[0].id;
      
      // Insert a listing directly
      await db.sequelize.query(`
        INSERT INTO "Listings" 
        (title, description, "pricePerNight", "maxGuests", "bedroomCount", "bathroomCount", "hostId", status, "isActive", "createdAt", "updatedAt") 
        VALUES 
        ('Sample Luxury Villa', 'A beautiful villa for your vacation', 150.00, 4, 2, 2, :hostId, 'active', true, NOW(), NOW())
        RETURNING id, title, "hostId", "pricePerNight"
      `, {
        replacements: { hostId },
        type: db.sequelize.QueryTypes.INSERT
      });
      
      // Get the newly created listing
      listing = await db.sequelize.query(
        'SELECT id, title, "hostId", "pricePerNight" FROM "Listings" ORDER BY id DESC LIMIT 1',
        { type: db.sequelize.QueryTypes.SELECT }
      );
    }
    
    const listingData = listing[0];
    console.log(`Using listing: ${listingData.id} - ${listingData.title}`);

    // Create sample bookings and payments for each user
    for (const user of users) {
      // Skip if the user is the host of the listing
      if (user.id === listingData.hostId) continue;

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
        
        // Format dates for SQL
        const checkIn = startDate.toISOString().split('T')[0];
        const checkOut = endDate.toISOString().split('T')[0];
        
        // Calculate total price
        const pricePerNight = listingData.pricePerNight || 150.00; // Use 150 as default if price is null
        const totalPrice = pricePerNight * stayDuration;
        const numberOfGuests = Math.floor(Math.random() * 3) + 1;
        
        // Insert booking directly with SQL
        const bookingResult = await db.sequelize.query(`
          INSERT INTO "Bookings" 
          ("listingId", "guestId", "hostId", "checkIn", "checkOut", "numberOfGuests", "totalPrice", status, "paymentStatus", "isActive", "createdAt", "updatedAt") 
          VALUES 
          (:listingId, :guestId, :hostId, :checkIn, :checkOut, :numberOfGuests, :totalPrice, 'completed', 'paid', true, NOW(), NOW())
          RETURNING id
        `, {
          replacements: { 
            listingId: listingData.id,
            guestId: user.id,
            hostId: listingData.hostId,
            checkIn,
            checkOut,
            numberOfGuests,
            totalPrice
          },
          type: db.sequelize.QueryTypes.INSERT
        });
        
        // Get the booking ID
        const bookingId = bookingResult[0][0].id;
        
        // Insert payment directly with SQL - bypassing the model validations
        await db.sequelize.query(`
          INSERT INTO "Payments" 
          ("bookingId", amount, currency, "paymentMethod", status, "processedAt", "completedAt", "isActive", "createdAt", "updatedAt") 
          VALUES 
          (:bookingId, :amount, 'USD', 'credit_card', 'completed', NOW(), NOW(), true, NOW(), NOW())
        `, {
          replacements: { 
            bookingId,
            amount: totalPrice
          },
          type: db.sequelize.QueryTypes.INSERT
        });
        
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
addSampleDataWithSQL(); 