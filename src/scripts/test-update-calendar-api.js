/**
 * Script to test the updateCalendar API endpoint
 * 
 * This script directly calls the updateCalendar controller function 
 * to verify it only creates the exact dates specified in the request.
 * 
 * Usage: 
 *   node src/scripts/test-update-calendar-api.js
 */

const db = require('../models');
const listingController = require('../controllers/listingController');

// Mock Express request and response objects
const createMockReqRes = (listingId, calendarData) => {
  const req = {
    params: { listingId },
    body: { calendar: calendarData },
    user: { id: 34 } // Mock user ID
  };
  
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      return this;
    },
    send: function(data) {
      this.data = data;
      return this;
    }
  };
  
  return { req, res };
};

async function testUpdateCalendarAPI() {
  try {
    console.log('1. Creating test listing...');
    
    const testId = Date.now() % 1000; // Use a portion of current timestamp as ID
    
    // Create a test listing
    const listing = await db.Listing.create(
      {
        title: `API Test ${testId}`,
        description: 'This listing was created to test the updateCalendar API',
        slug: `api-test-${testId}`,
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
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. Check for any calendar entries that might have been auto-created
    const initialEntries = await db.BookingCalendar.findAll({
      where: { listingId: listing.id },
      order: [['date', 'ASC']]
    });
    
    console.log(`Initial calendar entries: ${initialEntries.length}`);
    
    // 3. Prepare exact calendar dates to add (just 2 specific days)
    console.log('\n2. Calling updateCalendar with exactly two calendar dates...');
    
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
    
    // Format dates as strings (ISO format YYYY-MM-DD)
    const dateOneStr = dateOne.toISOString().split('T')[0];
    const dateTwoStr = dateTwo.toISOString().split('T')[0];
    
    console.log(`Adding dates via API: ${dateOneStr} and ${dateTwoStr}`);
    
    // Create calendar data in the format expected by the API
    const calendarData = [
      {
        date: dateOneStr,
        isAvailable: true,
        price: 100
      },
      {
        date: dateTwoStr,
        isAvailable: true,
        price: 100
      }
    ];
    
    // Call the updateCalendar function directly with mock req/res
    const { req, res } = createMockReqRes(listing.id, calendarData);
    
    // Call the controller function
    await listingController.updateCalendar(req, res);
    
    // Log the API response
    console.log(`API Response:`, {
      statusCode: res.statusCode,
      data: res.data
    });
    
    if (res.statusCode !== 200) {
      console.error('API call failed with error:', res.data.error || 'Unknown error');
      return false;
    }
    
    // 4. Verify only those two dates were added
    console.log('\n3. Verifying results...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for DB operations
    
    const finalEntries = await db.BookingCalendar.findAll({
      where: { listingId: listing.id },
      order: [['date', 'ASC']]
    });
    
    console.log(`Total calendar entries after API call: ${finalEntries.length}`);
    
    if (finalEntries.length === 2) {
      console.log('SUCCESS! Only the exact 2 dates were created via the API.');
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
    
    console.log('\nAPI test completed successfully!');
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
  testUpdateCalendarAPI().then(success => {
    console.log('Script execution complete');
    process.exit(success ? 0 : 1);
  }).catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  });
}

module.exports = { testUpdateCalendarAPI }; 