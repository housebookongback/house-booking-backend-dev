require('dotenv').config();
const db = require('./src/models');
const { User, PropertyType, Location, Listing } = require('./src/models');

async function addSampleProperties() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();
    console.log('Connection established successfully.');

    // Get all users that can be hosts
    const users = await User.findAll({
      limit: 5
    });

    if (!users.length) {
      console.log('No users found. Please run the user seeder first.');
      return;
    }

    console.log(`Found ${users.length} users to use as hosts.`);

    // Create property types if they don't exist
    const propertyTypes = [
      { name: 'House', description: 'A single-family home' },
      { name: 'Apartment', description: 'A unit in a multi-unit building' },
      { name: 'Villa', description: 'A luxury vacation home' },
      { name: 'Cabin', description: 'A small house in a rural setting' },
      { name: 'Condo', description: 'A condominium unit' }
    ];

    for (const type of propertyTypes) {
      const [propertyType] = await PropertyType.findOrCreate({
        where: { name: type.name },
        defaults: type
      });
      console.log(`PropertyType: ${propertyType.name}`);
    }

    // Create locations if they don't exist
    const locations = [
      { name: 'Paris, France', slug: 'paris-france' },
      { name: 'New York, USA', slug: 'new-york-usa' },
      { name: 'Tokyo, Japan', slug: 'tokyo-japan' },
      { name: 'London, UK', slug: 'london-uk' },
      { name: 'Sydney, Australia', slug: 'sydney-australia' }
    ];

    for (const loc of locations) {
      const [location] = await Location.findOrCreate({
        where: { name: loc.name },
        defaults: loc
      });
      console.log(`Location: ${location.name}`);
    }

    // Get all property types and locations
    const allPropertyTypes = await PropertyType.findAll();
    const allLocations = await Location.findAll();

    // Create sample properties
    const sampleProperties = [
      {
        title: 'Luxury Villa with Ocean View',
        description: 'A beautiful villa with stunning ocean views',
        status: 'published',
        pricePerNight: 250.00,
        cleaningFee: 50.00,
        securityDeposit: 200.00,
        accommodates: 6,
        bedrooms: 3,
        beds: 4,
        bathrooms: 2,
        minimumNights: 2,
        maximumNights: 14,
        instantBookable: true,
        isActive: true
      },
      {
        title: 'Cozy Downtown Apartment',
        description: 'A modern apartment in the heart of the city',
        status: 'published',
        pricePerNight: 120.00,
        cleaningFee: 30.00,
        securityDeposit: 100.00,
        accommodates: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        minimumNights: 1,
        maximumNights: 30,
        instantBookable: true,
        isActive: true
      },
      {
        title: 'Rustic Mountain Cabin',
        description: 'A peaceful cabin retreat surrounded by nature',
        status: 'published',
        pricePerNight: 180.00,
        cleaningFee: 40.00,
        securityDeposit: 150.00,
        accommodates: 4,
        bedrooms: 2,
        beds: 3,
        bathrooms: 1.5,
        minimumNights: 2,
        maximumNights: 10,
        instantBookable: false,
        isActive: true
      },
      {
        title: 'Modern Beachfront Condo',
        description: 'Steps away from the beach with amazing views',
        status: 'published',
        pricePerNight: 200.00,
        cleaningFee: 45.00,
        securityDeposit: 175.00,
        accommodates: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 2,
        minimumNights: 3,
        maximumNights: 14,
        instantBookable: true,
        isActive: true
      },
      {
        title: 'Historic Townhouse',
        description: 'A charming historic townhouse in a vibrant neighborhood',
        status: 'published',
        pricePerNight: 160.00,
        cleaningFee: 35.00,
        securityDeposit: 125.00,
        accommodates: 5,
        bedrooms: 2,
        beds: 3,
        bathrooms: 1.5,
        minimumNights: 2,
        maximumNights: 21,
        instantBookable: false,
        isActive: true
      }
    ];

    // Create listings
    for (let i = 0; i < sampleProperties.length; i++) {
      const property = sampleProperties[i];
      const hostId = users[i % users.length].id;
      const propertyTypeId = allPropertyTypes[i % allPropertyTypes.length].id;
      const locationId = allLocations[i % allLocations.length].id;
      
      const slug = property.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      const checkInDays = [0, 1, 2, 3, 4, 5, 6]; // All days of week
      const checkOutDays = [0, 1, 2, 3, 4, 5, 6]; // All days of week
      
      await Listing.findOrCreate({
        where: { title: property.title },
        defaults: {
          ...property,
          slug,
          hostId,
          propertyTypeId,
          locationId,
          checkInDays,
          checkOutDays,
          cancellationPolicy: 'moderate',
          defaultAvailability: true,
          stepStatus: JSON.stringify({
            basicInfo: true,
            location: true,
            details: true,
            pricing: true,
            photos: true,
            amenities: true,
            rules: true,
            calendar: true
          })
        }
      });
      
      console.log(`Created property: ${property.title}`);
    }

    console.log('Sample properties added successfully!');
  } catch (error) {
    console.error('Error adding sample properties:', error);
  } finally {
    process.exit();
  }
}

// Run the function
addSampleProperties(); 