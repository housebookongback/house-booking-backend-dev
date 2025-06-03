/**
 * Script to create a test listing and verify calendar entries are created
 * 
 * Usage: 
 *   node src/scripts/create-test-listing.js
 */

const db = require('../models');

async function createTestListing() {
  try {
    console.log('Creating test listing...');
    
    // Create a test listing
    const listing = await db.Listing.create(
      {
        title: 'Calendar Auto-Creation Test',
        description: 'This listing was created to test automatic calendar entry creation',
        slug: 'calendar-auto-creation-test-' + Date.now(),
        hostId: 34, // Default test user
        propertyTypeId: 18, // Using value from listing #289
        categoryId: 7, // Using value from listing #289
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
    
    // Wait for hooks to execute
    console.log('Waiting for hooks to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if calendar entries were created
    const calendarEntries = await db.BookingCalendar.findAll({
      where: { listingId: listing.id },
      order: [['date', 'ASC']]
    });
    
    console.log(`\n=== Calendar Entry Results ===`);
    console.log(`Found ${calendarEntries.length} calendar entries for the new listing`);
    
    if (calendarEntries.length > 0) {
      console.log('\nSample entries:');
      calendarEntries.slice(0, 5).forEach(entry => {
        const dateStr = entry.date instanceof Date 
          ? entry.date.toISOString().split('T')[0] 
          : String(entry.date);
        console.log(`- ${dateStr} (isAvailable: ${entry.isAvailable})`);
      });
      
      console.log('\nTest Result: ✓ SUCCESS - Calendar entries were automatically created');
    } else {
      console.log('\nTest Result: ✗ FAIL - No calendar entries were created');
    }
    
    console.log('\nCleaning up test data...');
    
    // Delete the test listing's calendar entries
    await db.BookingCalendar.destroy({
      where: { listingId: listing.id },
      force: true
    });
    
    // Delete the test listing
    await listing.destroy({ force: true });
    
    console.log('Test data cleaned up successfully');
    return calendarEntries.length > 0;
  } catch (error) {
    console.error('Error in test:', error);
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
  createTestListing().then(success => {
    console.log('\nScript execution complete');
    process.exit(success ? 0 : 1);
  }).catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  });
}

module.exports = { createTestListing }; 