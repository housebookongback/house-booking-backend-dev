require('dotenv').config();
const { Sequelize } = require('sequelize');
const db = require('./src/models');

async function checkBookingsAndPayments() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();
    console.log('Connection established successfully.');

    // Check bookings
    const bookings = await db.sequelize.query(
      'SELECT COUNT(*) as count FROM "Bookings" WHERE "deletedAt" IS NULL',
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    console.log(`Total bookings in database: ${bookings[0].count}`);
    
    // Check payments
    const payments = await db.sequelize.query(
      'SELECT COUNT(*) as count FROM "Payments" WHERE "deletedAt" IS NULL',
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    console.log(`Total payments in database: ${payments[0].count}`);
    
    // Check some sample users with their bookings
    const usersWithBookings = await db.sequelize.query(
      `SELECT u.id, u.email, COUNT(b.id) as booking_count 
       FROM "Users" u
       LEFT JOIN "Bookings" b ON u.id = b."guestId"
       WHERE u."deletedAt" IS NULL
       GROUP BY u.id, u.email
       ORDER BY booking_count DESC
       LIMIT 10`,
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    console.log('Users with booking counts:');
    usersWithBookings.forEach(user => {
      console.log(`  User ${user.id} (${user.email}): ${user.booking_count} bookings`);
    });
    
    // Check some sample users with their payments
    const usersWithPayments = await db.sequelize.query(
      `SELECT u.id, u.email, SUM(p.amount) as total_spent
       FROM "Users" u
       JOIN "Bookings" b ON u.id = b."guestId"
       JOIN "Payments" p ON b.id = p."bookingId" AND p.status = 'completed'
       WHERE u."deletedAt" IS NULL
       GROUP BY u.id, u.email
       ORDER BY total_spent DESC
       LIMIT 10`,
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    console.log('Users with payment totals:');
    usersWithPayments.forEach(user => {
      console.log(`  User ${user.id} (${user.email}): $${parseFloat(user.total_spent).toFixed(2)}`);
    });

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    process.exit();
  }
}

// Run the function
checkBookingsAndPayments(); 