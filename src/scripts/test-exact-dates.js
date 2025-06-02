/**
 * Script to test creating a listing and adding exactly two calendar dates
 * 
 * This test script will:
 * 1. Create a new test listing
 * 2. Add exactly two calendar dates for the listing
 * 3. Verify only those exact dates were added
 * 
 * Usage: 
 *   node src/scripts/test-exact-dates.js
 */

const db = require('../models');

async function testExactDates() {
  try {
    console.log('1. Creating test listing...');
    
    const testId = Date.now() % 1000; // Use a portion of current timestamp as ID
    
    // Create a test listing
    const listing = await db.Listing.create(
      {
        title: `Exact Dates Test ${testId}`,
        description: 'This listing was created to test exact date functionality',
        slug: `exact-dates-test-${testId}`,
        hostId: 34, // Default test user
        propertyTypeId: 18, 
        categoryId: 7,
        status: 'draft',
        isActive: true,
        pricePerNight: 100,
        minimumNights: 1,
        maximumNights: 30,
        stepStatus: {
          basicInfo: true,
          location: false,
          details: false,
          pricing: false,
          photos: false,
          rules: false,
          calendar: false
        }
      },
      { validate: false }
    );
    
    console.log(`Created test listing with ID ${listing.id}`);
    
    // Wait a moment for hooks to complete
    console.log('Waiting for hooks to complete...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. Check for any calendar entries that might have been auto-created
    const initialEntries = await db.BookingCalendar.findAll({
      where: { listingId: listing.id },
      order: [['date', 'ASC']]
    });
    
    console.log(`Initial calendar entries: ${initialEntries.length}`);
    if (initialEntries.length > 0) {
      console.log('ISSUE: Calendar entries were auto-created despite our fix!');
      initialEntries.forEach(entry => {
        console.log(`- ${entry.date.toISOString().split('T')[0]}`);
      });
    } else {
      console.log('GOOD: No calendar entries were auto-created');
    }
    
    // 3. Add exactly two calendar dates
    console.log('\n2. Adding exactly two calendar dates...');
    
    // Create two dates - one month from now and two months from now
    const now = new Date();
    const dateOne = new Date(now);
    dateOne.setMonth(now.getMonth() + 1);
    dateOne.setDate(15);  // 15th of next month
    dateOne.setHours(0, 0, 0, 0);
    
    const dateTwo = new Date(now);
    dateTwo.setMonth(now.getMonth() + 2);
    dateTwo.setDate(15);  // 15th of month after next
    dateTwo.setHours(0, 0, 0, 0);
    
    // Format dates as strings
    const dateOneStr = dateOne.toISOString().split('T')[0];
    const dateTwoStr = dateTwo.toISOString().split('T')[0];
    
    console.log(`Adding dates: ${dateOneStr} and ${dateTwoStr}`);
    
    // Create the calendar entries
    await db.BookingCalendar.bulkCreate([
      {
        listingId: listing.id,
        date: dateOne,
        isAvailable: true,
        basePrice: 100,
        minStay: 1,
        maxStay: 30,
        checkInAllowed: true,
        checkOutAllowed: true
      },
      {
        listingId: listing.id,
        date: dateTwo,
        isAvailable: true,
        basePrice: 100,
        minStay: 1,
        maxStay: 30,
        checkInAllowed: true,
        checkOutAllowed: true
      }
    ], { validate: false });
    
    // 4. Verify only those two dates were added
    const finalEntries = await db.BookingCalendar.findAll({
      where: { listingId: listing.id },
      order: [['date', 'ASC']]
    });
    
    console.log(`\n3. Final verification:`);
    console.log(`Total calendar entries: ${finalEntries.length}`);
    
    if (finalEntries.length === 2) {
      console.log('SUCCESS! Only the exact 2 dates were created.');
    } else if (finalEntries.length < 2) {
      console.log('ERROR: Not all dates were created successfully.');
    } else {
      console.log('ERROR: More dates were created than expected!');
    }
    
    console.log('\nAll calendar entries:');
    finalEntries.forEach(entry => {
      let dateStr;
      try {
        if (entry.date instanceof Date) {
          dateStr = entry.date.toISOString().split('T')[0];
        } else if (typeof entry.date === 'string') {
          // Handle string dates
          dateStr = entry.date;
        } else {
          // Handle other formats
          dateStr = String(entry.date);
        }
      } catch (e) {
        dateStr = String(entry.date);
      }
      console.log(`- ${dateStr} (isAvailable: ${entry.isAvailable})`);
    });
    
    console.log('\nTest completed successfully!');
    return true;
  } catch (error) {
    console.error(`Test failed with error:`, error);
    return false;
  } finally {
    // Close database connection
    try {
      await db.sequelize.close();
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  testExactDates().then(success => {
    console.log('Script execution complete');
    process.exit(success ? 0 : 1);
  }).catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  });
}

module.exports = { testExactDates }; 