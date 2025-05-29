require('dotenv').config();
const { Sequelize } = require('sequelize');
const db = require('./src/models');

async function createSampleListings() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();
    console.log('Connection established successfully.');

    // Get host ID
    console.log('Looking for a host user...');
    const users = await db.sequelize.query(
      'SELECT id FROM "Users" LIMIT 1',
      { type: db.sequelize.QueryTypes.SELECT }
    );

    if (!users.length) {
      console.log('No users found. Please create users first.');
      return;
    }

    const hostId = users[0].id;
    console.log(`Using host ID: ${hostId}`);

    // Create property types if needed
    console.log('Looking for property types...');
    const propertyTypeResult = await db.sequelize.query(
      'SELECT id FROM "PropertyTypes" LIMIT 1',
      { type: db.sequelize.QueryTypes.SELECT }
    );

    let propertyTypeId;
    if (!propertyTypeResult.length) {
      console.log('No property types found, creating one...');
      // Create property type
      const insertPropertyType = await db.sequelize.query(
        `INSERT INTO "PropertyTypes" (name, description, "isActive", "createdAt", "updatedAt") 
         VALUES ('House', 'A standard house', TRUE, NOW(), NOW()) RETURNING id`,
        { type: db.sequelize.QueryTypes.INSERT }
      );
      propertyTypeId = insertPropertyType[0][0].id;
    } else {
      propertyTypeId = propertyTypeResult[0].id;
    }
    console.log(`Using property type ID: ${propertyTypeId}`);

    // Create location if needed
    console.log('Looking for locations...');
    const locationResult = await db.sequelize.query(
      'SELECT id FROM "Locations" LIMIT 1',
      { type: db.sequelize.QueryTypes.SELECT }
    );

    let locationId;
    if (!locationResult.length) {
      console.log('No locations found, creating one...');
      // Create location
      const insertLocation = await db.sequelize.query(
        `INSERT INTO "Locations" (name, "isActive", "createdAt", "updatedAt") 
         VALUES ('Paris, France', TRUE, NOW(), NOW()) RETURNING id`,
        { type: db.sequelize.QueryTypes.INSERT }
      );
      locationId = insertLocation[0][0].id;
    } else {
      locationId = locationResult[0].id;
    }
    console.log(`Using location ID: ${locationId}`);

    // Create 5 sample listings
    console.log('Creating sample listings...');
    for (let i = 1; i <= 5; i++) {
      const title = `Sample Property ${i}`;
      const slug = `sample-property-${i}`;
      const price = 100 + (i * 50);
      
      // Check if the listing already exists
      console.log(`Checking if "${title}" already exists...`);
      const existingListing = await db.sequelize.query(
        'SELECT id FROM "Listings" WHERE slug = :slug',
        { 
          replacements: { slug },
          type: db.sequelize.QueryTypes.SELECT 
        }
      );

      if (existingListing.length === 0) {
        console.log(`Creating new listing: ${title}`);
        // Insert the listing
        await db.sequelize.query(
          `INSERT INTO "Listings" (
            title, slug, description, "hostId", "propertyTypeId", "locationId",
            "pricePerNight", "cleaningFee", "securityDeposit", 
            accommodates, bedrooms, beds, bathrooms,
            "minimumNights", "maximumNights", "cancellationPolicy",
            "isActive", status, "createdAt", "updatedAt"
          ) VALUES (
            :title, :slug, :description, :hostId, :propertyTypeId, :locationId,
            :pricePerNight, :cleaningFee, :securityDeposit,
            :accommodates, :bedrooms, :beds, :bathrooms,
            :minimumNights, :maximumNights, :cancellationPolicy,
            TRUE, 'published', NOW(), NOW()
          )`,
          { 
            replacements: { 
              title,
              slug,
              description: `This is a beautiful property number ${i}`,
              hostId,
              propertyTypeId,
              locationId,
              pricePerNight: price,
              cleaningFee: 50,
              securityDeposit: 200,
              accommodates: 2 + i,
              bedrooms: 1 + Math.floor(i/2),
              beds: 1 + Math.floor(i/2),
              bathrooms: 1 + (i > 3 ? 1 : 0),
              minimumNights: 1,
              maximumNights: 30,
              cancellationPolicy: 'moderate'
            },
            type: db.sequelize.QueryTypes.INSERT 
          }
        );
        console.log(`Created listing: ${title}`);
      } else {
        console.log(`Listing "${title}" already exists with ID ${existingListing[0].id}, skipping.`);
      }
    }

    console.log('Sample listings created successfully!');
  } catch (error) {
    console.error('Error creating sample listings:', error);
    console.error(error.stack);
  } finally {
    process.exit();
  }
}

// Run the function
createSampleListings(); 