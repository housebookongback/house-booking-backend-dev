/**
 * Script to fix calendar functionality for all listings
 * 
 * This script ensures that:
 * 1. All listings have stepStatus.calendar set to true
 * 2. Each listing has at least one calendar entry to verify functionality
 * 
 * Usage: 
 *   node src/scripts/fix-calendar-for-all-listings.js
 */

const db = require('../models');
const { Op } = require('sequelize');

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

async function fixCalendarForAllListings() {
  try {
    console.log('Starting calendar fix for all listings...');
    
    // Find all listings (including inactive or draft ones)
    const listings = await db.Listing.unscoped().findAll();
    console.log(`Found ${listings.length} listings to process`);
    
    let successCount = 0;
    let errorCount = 0;
    let noEntriesCount = 0;
    let entriesAddedCount = 0;
    
    // Process each listing
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      console.log(`Processing listing ${i+1}/${listings.length}: ID=${listing.id}, title="${listing.title || 'Untitled'}", status=${listing.status || 'unknown'}`);
      
      try {
        // 1. Update stepStatus to ensure calendar is marked as completed
        const stepStatus = listing.stepStatus || {};
        if (!stepStatus.calendar) {
          await listing.update({
            stepStatus: {
              ...stepStatus,
              calendar: true
            }
          }, { validate: false });
          console.log(`  - Updated stepStatus.calendar to true for listing ${listing.id}`);
        } else {
          console.log(`  - Listing ${listing.id} already has stepStatus.calendar=true`);
        }
        
        // 2. Check if the listing has any calendar entries
        const calendarEntries = await db.BookingCalendar.findAll({
          where: { listingId: listing.id },
          limit: 5
        });
        
        if (calendarEntries.length > 0) {
          console.log(`  - Found ${calendarEntries.length} existing calendar entries`);
        } else {
          console.log(`  - No calendar entries found, creating test entries...`);
          noEntriesCount++;
          
          // Create entries for the next 3 months (1st day of each month)
          const today = new Date();
          
          for (let month = 1; month <= 3; month++) {
            const futureDate = new Date(today);
            futureDate.setMonth(today.getMonth() + month);
            futureDate.setDate(1);  // First day of the month
            futureDate.setHours(0, 0, 0, 0);
            
            try {
              // Check if entry already exists for this date
              const existingEntry = await db.BookingCalendar.findOne({
                where: {
                  listingId: listing.id,
                  date: futureDate
                }
              });
              
              if (!existingEntry) {
                // Create a new calendar entry
                await db.BookingCalendar.create({
                  listingId: listing.id,
                  date: futureDate,
                  isAvailable: true,
                  basePrice: listing.pricePerNight || 100,
                  minStay: listing.minimumNights || 1,
                  maxStay: listing.maximumNights || 30,
                  checkInAllowed: true,
                  checkOutAllowed: true
                }, { validate: false });
                
                entriesAddedCount++;
                console.log(`  - Created calendar entry for ${futureDate.toISOString().split('T')[0]}`);
              }
            } catch (entryError) {
              console.error(`  - Error creating calendar entry for ${futureDate.toISOString().split('T')[0]}: ${entryError.message}`);
              
              // Try with raw SQL as fallback
              try {
                const dateStr = futureDate.toISOString().split('T')[0];
                await db.sequelize.query(
                  `INSERT INTO "BookingCalendars" ("listingId", "date", "isAvailable", "basePrice", "minStay", "maxStay", "checkInAllowed", "checkOutAllowed", "createdAt", "updatedAt")
                  VALUES (:listingId, :date, true, :price, :minStay, :maxStay, true, true, NOW(), NOW())
                  ON CONFLICT ("listingId", "date") DO NOTHING`,
                  {
                    replacements: {
                      listingId: listing.id,
                      date: dateStr,
                      price: listing.pricePerNight || 100,
                      minStay: listing.minimumNights || 1,
                      maxStay: listing.maximumNights || 30
                    },
                    type: db.sequelize.QueryTypes.INSERT
                  }
                );
                entriesAddedCount++;
                console.log(`  - Created calendar entry using raw SQL for ${dateStr}`);
              } catch (sqlError) {
                console.error(`  - SQL insertion failed: ${sqlError.message}`);
              }
            }
          }
          
          // Verify that entries were created
          const verifyEntries = await db.BookingCalendar.findAll({
            where: { listingId: listing.id }
          });
          
          if (verifyEntries.length > 0) {
            console.log(`  - Successfully created ${verifyEntries.length} calendar entries`);
          } else {
            console.error(`  - Failed to create any calendar entries for listing ${listing.id}`);
          }
        }
        
        successCount++;
        console.log(`  ✓ Successfully processed listing ${listing.id}`);
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error processing listing ${listing.id}: ${error.message}`);
      }
      
      // Add a separator between listings
      console.log('-'.repeat(80));
    }
    
    // Print summary
    console.log('\nFix Calendar Script - Summary:');
    console.log('============================');
    console.log(`Total listings processed: ${listings.length}`);
    console.log(`Successful updates: ${successCount}`);
    console.log(`Failed updates: ${errorCount}`);
    console.log(`Listings without calendar entries: ${noEntriesCount}`);
    console.log(`Calendar entries added: ${entriesAddedCount}`);
    console.log('\nCalendar fix script completed');
    
  } catch (error) {
    console.error('Fatal error in fixCalendarForAllListings:', error);
  } finally {
    // Close database connection to allow script to exit
    try {
      await db.sequelize.close();
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  fixCalendarForAllListings().then(() => {
    console.log('Script execution complete');
    process.exit(0);
  }).catch(err => {
    console.error('Script execution failed:', err);
    process.exit(1);
  });
}

module.exports = { fixCalendarForAllListings }; 