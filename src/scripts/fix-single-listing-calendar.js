/**
 * Script to fix calendar functionality for a specific listing
 * 
 * This script can fix calendar entries for specific dates for a listing.
 * Unlike before, it will only add dates that are explicitly specified.
 * 
 * Usage: 
 *   node src/scripts/fix-single-listing-calendar.js <listingId> [date1] [date2] ...
 * 
 * Example:
 *   node src/scripts/fix-single-listing-calendar.js 290 2025-06-01 2025-06-02
 *   
 * If no dates are provided, it will only mark the calendar step as complete.
 */

const db = require('../models');
const { Op } = require('sequelize');

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Extract listing ID and dates from command line arguments
const getArgsFromCommandLine = () => {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Error: Please provide a listing ID');
    process.exit(1);
  }
  
  const listingId = parseInt(args[0], 10);
  if (isNaN(listingId)) {
    console.error('Error: Listing ID must be a number');
    process.exit(1);
  }
  
  // Get dates if provided (arguments after the listing ID)
  const dates = args.slice(1).map(dateStr => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn(`Warning: Invalid date format '${dateStr}', skipping`);
        return null;
      }
      return date;
    } catch (error) {
      console.warn(`Warning: Invalid date '${dateStr}', skipping`);
      return null;
    }
  }).filter(Boolean); // Remove invalid dates
  
  return { listingId, dates };
};

/**
 * Fixes calendar entries for a listing, but only for the specific dates provided
 */
async function fixSingleListingCalendar() {
  const { listingId, dates } = getArgsFromCommandLine();
  
  try {
    console.log(`Starting calendar fix for listing ${listingId}...`);
    
    // Find the listing
    const listing = await db.Listing.unscoped().findByPk(listingId);
    
    if (!listing) {
      console.error(`Error: Listing ${listingId} not found`);
      process.exit(1);
    }
    
    console.log(`Found listing: ID=${listing.id}, title="${listing.title}", status=${listing.status}`);
    
    // Check current calendar entries
    const existingEntries = await db.BookingCalendar.findAll({
      where: { listingId },
      order: [['date', 'ASC']]
    });
    
    console.log(`Found ${existingEntries.length} existing calendar entries`);
    
    if (existingEntries.length > 0) {
      console.log('Sample existing entries:');
      existingEntries.slice(0, 5).forEach(entry => {
        const dateStr = entry.date instanceof Date 
          ? entry.date.toISOString().split('T')[0] 
          : String(entry.date);
        console.log(`- ${dateStr} (isAvailable: ${entry.isAvailable})`);
      });
    }
    
    // If no dates provided, only update the step status
    if (dates.length === 0) {
      console.log('No dates provided. Only marking calendar step as complete.');
      
      // Update step status
      const stepStatus = listing.stepStatus || {};
      if (!stepStatus.calendar) {
        await listing.update({
          stepStatus: { 
            ...stepStatus,
            calendar: true 
          }
        }, { validate: false });
        console.log(`Updated listing step status: calendar = true`);
      } else {
        console.log('Calendar step was already marked as complete.');
      }
      
      return true;
    }
    
    // Create entries ONLY for the specific dates provided
    console.log(`Creating/updating calendar entries for ${dates.length} specific dates...`);
    
    let createdCount = 0;
    let errorCount = 0;
    
    // Process each date
    for (const date of dates) {
      try {
        // Check if entry already exists for this date
        const existing = await db.BookingCalendar.findOne({
          where: {
            listingId,
            date
          }
        });
        
        if (existing) {
          console.log(`Entry already exists for ${date.toISOString().split('T')[0]}, updating it`);
          await existing.update({
            isAvailable: true,
            basePrice: listing.pricePerNight || 100,
            minStay: listing.minimumNights || 1,
            maxStay: listing.maximumNights || 30,
            checkInAllowed: true,
            checkOutAllowed: true,
            updatedAt: new Date()
          });
          createdCount++;
          continue;
        }
        
        // Create a new calendar entry
        await db.BookingCalendar.create({
          listingId,
          date,
          isAvailable: true,
          basePrice: listing.pricePerNight || 100,
          minStay: listing.minimumNights || 1,
          maxStay: listing.maximumNights || 30,
          checkInAllowed: true,
          checkOutAllowed: true
        }, { validate: false });
        
        createdCount++;
        console.log(`Created entry for ${date.toISOString().split('T')[0]}`);
      } catch (error) {
        errorCount++;
        console.error(`Error creating entry for ${date.toISOString().split('T')[0]}: ${error.message}`);
        
        // Try with raw SQL as fallback
        try {
          const dateStr = date.toISOString().split('T')[0];
          await db.sequelize.query(
            `INSERT INTO "BookingCalendars" ("listingId", "date", "isAvailable", "basePrice", "minStay", "maxStay", "checkInAllowed", "checkOutAllowed", "createdAt", "updatedAt")
            VALUES (:listingId, :date, true, :price, :minStay, :maxStay, true, true, NOW(), NOW())
            ON CONFLICT ("listingId", "date") DO UPDATE SET
            "isAvailable" = true,
            "basePrice" = :price,
            "updatedAt" = NOW()`,
            {
              replacements: {
                listingId,
                date: dateStr,
                price: listing.pricePerNight || 100,
                minStay: listing.minimumNights || 1,
                maxStay: listing.maximumNights || 30
              },
              type: db.sequelize.QueryTypes.INSERT
            }
          );
          console.log(`Created/updated entry using raw SQL for ${dateStr}`);
          createdCount++;
          errorCount--;
        } catch (sqlError) {
          console.error(`SQL insertion failed: ${sqlError.message}`);
        }
      }
    }
    
    // Update step status
    const stepStatus = listing.stepStatus || {};
    if (!stepStatus.calendar) {
      await listing.update({
        stepStatus: { 
          ...stepStatus,
          calendar: true 
        }
      }, { validate: false });
      console.log(`Updated listing step status: calendar = true`);
    }
    
    // Verify results
    const finalEntries = await db.BookingCalendar.findAll({
      where: { listingId },
      order: [['date', 'ASC']]
    });
    
    console.log(`\nCalendar Fix Results:`);
    console.log(`=====================`);
    console.log(`Listing: ${listing.id} (${listing.title})`);
    console.log(`Initial entries: ${existingEntries.length}`);
    console.log(`Dates processed: ${dates.length}`);
    console.log(`Entries created/updated: ${createdCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    console.log(`Total entries now: ${finalEntries.length}`);
    
    if (finalEntries.length > 0) {
      console.log('\nSample calendar entries:');
      finalEntries.slice(0, 5).forEach(entry => {
        const dateStr = entry.date instanceof Date 
          ? entry.date.toISOString().split('T')[0] 
          : String(entry.date);
        console.log(`- ${dateStr} (isAvailable: ${entry.isAvailable})`);
      });
    }
    
    console.log('\nCalendar fix completed successfully!');
    return true;
  } catch (error) {
    console.error(`Error fixing calendar for listing ${listingId}:`, error);
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
  fixSingleListingCalendar().then(success => {
    console.log('Script execution complete');
    process.exit(success ? 0 : 1);
  }).catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  });
}

module.exports = { fixSingleListingCalendar }; 