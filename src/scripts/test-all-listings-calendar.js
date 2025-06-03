/**
 * Script to test calendar functionality for specific listings
 * 
 * This script tests both adding and retrieving calendar entries
 * for specified listings, helping diagnose calendar-related issues.
 * 
 * Usage:
 *   node src/scripts/test-all-listings-calendar.js [listingId1] [listingId2] ...
 *   
 * Examples:
 *   node src/scripts/test-all-listings-calendar.js 287 289
 *   node src/scripts/test-all-listings-calendar.js
 *   
 * If no listing IDs are provided, it will test a few default listings.
 */

const db = require('../models');
const { Op } = require('sequelize');

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Extract listing IDs from command line arguments
const getListingIdsFromArgs = () => {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    // Default listings to test if none specified
    return [287, 289];
  }
  return args.map(arg => parseInt(arg, 10)).filter(id => !isNaN(id));
};

/**
 * Test adding calendar entries for a listing
 */
async function testAddCalendarEntries(listingId) {
  console.log(`\n=== Testing Adding Calendar Entries for Listing ${listingId} ===`);
  
  try {
    // First, find the listing
    const listing = await db.Listing.unscoped().findByPk(listingId);
    
    if (!listing) {
      console.log(`Creating test listing ${listingId} since it doesn't exist...`);
      // Create a test listing if it doesn't exist
      const newListing = await db.Listing.create({
        id: listingId,
        title: `Test Listing ${listingId}`,
        slug: `test-listing-${listingId}`,
        description: 'Test listing for calendar functionality',
        hostId: 34, // Default host ID
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
      }, { validate: false });
      console.log(`Created test listing ${newListing.id}`);
    } else {
      console.log(`Found listing ${listing.id}: "${listing.title}"`);
    }
    
    // Create test calendar entries
    console.log('Creating test calendar entries...');
    
    // Get today and the next 3 days
    const today = new Date();
    const dates = [];
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i + 1);
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }
    
    // Delete any existing entries for these dates
    try {
      await db.BookingCalendar.destroy({
        where: {
          listingId,
          date: {
            [Op.in]: dates
          }
        },
        force: true // Hard delete
      });
      console.log(`Deleted existing calendar entries for test dates`);
    } catch (deleteError) {
      console.error(`Error deleting existing entries: ${deleteError.message}`);
    }
    
    // Create new entries
    const calendarEntries = [];
    for (const date of dates) {
      try {
        const entry = await db.BookingCalendar.create({
          listingId,
          date,
          isAvailable: true,
          basePrice: 100,
          minStay: 1,
          maxStay: 30,
          checkInAllowed: true,
          checkOutAllowed: true
        }, { validate: false });
        
        calendarEntries.push(entry);
        console.log(`✓ Created entry for ${date.toISOString().split('T')[0]}`);
      } catch (createError) {
        console.error(`✗ Failed to create entry for ${date.toISOString().split('T')[0]}: ${createError.message}`);
        
        // Try raw SQL as fallback
        try {
          const dateStr = date.toISOString().split('T')[0];
          await db.sequelize.query(
            `INSERT INTO "BookingCalendars" ("listingId", "date", "isAvailable", "basePrice", "minStay", "maxStay", "checkInAllowed", "checkOutAllowed", "createdAt", "updatedAt")
            VALUES (:listingId, :date, true, 100, 1, 30, true, true, NOW(), NOW())
            ON CONFLICT ("listingId", "date") DO NOTHING`,
            {
              replacements: {
                listingId,
                date: dateStr
              },
              type: db.sequelize.QueryTypes.INSERT
            }
          );
          console.log(`✓ Created entry using raw SQL for ${dateStr}`);
        } catch (sqlError) {
          console.error(`✗ SQL insert failed: ${sqlError.message}`);
        }
      }
    }
    
    // Make sure step status is updated
    if (listing) {
      const stepStatus = listing.stepStatus || {};
      await listing.update({
        stepStatus: {
          ...stepStatus,
          calendar: true
        }
      }, { validate: false });
      console.log(`Updated stepStatus.calendar to true for listing ${listing.id}`);
    }
    
    return calendarEntries.length > 0;
  } catch (error) {
    console.error(`Error in testAddCalendarEntries: ${error.message}`);
    return false;
  }
}

/**
 * Test retrieving calendar entries for a listing
 */
async function testRetrieveCalendarEntries(listingId) {
  console.log(`\n=== Testing Retrieving Calendar Entries for Listing ${listingId} ===`);
  
  try {
    // Try different methods to retrieve entries
    
    // Method 1: Using the model
    console.log('Method 1: Using BookingCalendar.findAll()');
    const entries = await db.BookingCalendar.findAll({
      where: { listingId },
      order: [['date', 'ASC']]
    });
    
    console.log(`Found ${entries.length} entries via model`);
    if (entries.length > 0) {
      console.log('Sample entries:');
      entries.slice(0, 3).forEach((entry, i) => {
        let dateStr;
        try {
          // Handle date object or string safely
          if (entry.date instanceof Date) {
            dateStr = entry.date.toISOString().split('T')[0];
          } else if (typeof entry.date === 'string') {
            dateStr = entry.date;
          } else {
            dateStr = String(entry.date);
          }
        } catch (e) {
          dateStr = String(entry.date);
        }
        console.log(`  ${i+1}. ${dateStr} - Available: ${entry.isAvailable}, Price: ${entry.basePrice}`);
      });
    }
    
    // Method 2: Using raw SQL
    console.log('\nMethod 2: Using raw SQL query');
    const rawEntries = await db.sequelize.query(
      'SELECT * FROM "BookingCalendars" WHERE "listingId" = :listingId ORDER BY "date" ASC',
      {
        replacements: { listingId },
        type: db.sequelize.QueryTypes.SELECT
      }
    );
    
    console.log(`Found ${rawEntries.length} entries via raw SQL`);
    if (rawEntries.length > 0) {
      console.log('Sample entries:');
      rawEntries.slice(0, 3).forEach((entry, i) => {
        console.log(`  ${i+1}. ${entry.date} - Available: ${entry.isAvailable}, Price: ${entry.basePrice}`);
      });
    }
    
    // Method 3: Count only with raw SQL
    console.log('\nMethod 3: Using SQL COUNT query');
    const countResult = await db.sequelize.query(
      'SELECT COUNT(*) FROM "BookingCalendars" WHERE "listingId" = :listingId',
      {
        replacements: { listingId },
        type: db.sequelize.QueryTypes.SELECT
      }
    );
    
    console.log(`Count result: ${JSON.stringify(countResult)}`);
    
    // Method 4: Examining table structure (for debugging)
    console.log('\nMethod 4: Examining table structure');
    const tableInfo = await db.sequelize.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'BookingCalendars'",
      { type: db.sequelize.QueryTypes.SELECT }
    );
    
    console.log('BookingCalendars table structure:');
    tableInfo.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    return entries.length > 0 || rawEntries.length > 0;
  } catch (error) {
    console.error(`Error in testRetrieveCalendarEntries: ${error.message}`);
    return false;
  }
}

/**
 * Main function to test calendar functionality
 */
async function testCalendarFunctionality() {
  const listingIds = getListingIdsFromArgs();
  
  console.log(`Testing calendar functionality for listings: ${listingIds.join(', ')}`);
  console.log('='.repeat(80));
  
  const results = {};
  
  for (const listingId of listingIds) {
    console.log(`\n${'='.repeat(40)}`);
    console.log(`Testing Listing ${listingId}`);
    console.log(`${'='.repeat(40)}`);
    
    // Test adding entries
    const addSuccess = await testAddCalendarEntries(listingId);
    
    // Test retrieving entries
    const retrieveSuccess = await testRetrieveCalendarEntries(listingId);
    
    // Store results
    results[listingId] = {
      addSuccess,
      retrieveSuccess,
      overallSuccess: addSuccess && retrieveSuccess
    };
  }
  
  // Print summary
  console.log('\n\n=== Calendar Functionality Test Results ===');
  console.log('='.repeat(40));
  for (const [listingId, result] of Object.entries(results)) {
    console.log(`Listing ${listingId}:`);
    console.log(`  Add Entries: ${result.addSuccess ? '✓ SUCCESS' : '✗ FAIL'}`);
    console.log(`  Retrieve Entries: ${result.retrieveSuccess ? '✓ SUCCESS' : '✗ FAIL'}`);
    console.log(`  Overall: ${result.overallSuccess ? '✓ SUCCESS' : '✗ FAIL'}`);
    console.log('-'.repeat(40));
  }
  
  // Determine overall success
  const allSuccess = Object.values(results).every(r => r.overallSuccess);
  console.log(`\nOverall Test Result: ${allSuccess ? '✓ SUCCESS' : '✗ FAIL'}`);
  
  return allSuccess;
}

// Run the function if this script is executed directly
if (require.main === module) {
  testCalendarFunctionality().then(success => {
    console.log('Script execution complete');
    process.exit(success ? 0 : 1);
  }).catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  }).finally(async () => {
    // Close database connection
    try {
      await db.sequelize.close();
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  });
}

module.exports = { testCalendarFunctionality }; 