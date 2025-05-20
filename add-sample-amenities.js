require('dotenv').config();
const db = require('./src/models');

const sampleAmenities = [
  {
    name: 'Wi-Fi',
    icon: 'wifi',
    description: 'High-speed internet access',
    slug: 'wifi',
    isActive: true
  },
  {
    name: 'Kitchen',
    icon: 'kitchen',
    description: 'Full kitchen with appliances',
    slug: 'kitchen',
    isActive: true
  },
  {
    name: 'Pool',
    icon: 'pool',
    description: 'Swimming pool access',
    slug: 'pool',
    isActive: true
  },
  {
    name: 'Air Conditioning',
    icon: 'ac_unit',
    description: 'Climate control',
    slug: 'air-conditioning',
    isActive: true
  },
  {
    name: 'TV',
    icon: 'tv',
    description: 'Television with streaming services',
    slug: 'tv',
    isActive: true
  },
  {
    name: 'Parking',
    icon: 'local_parking',
    description: 'Free parking on premises',
    slug: 'parking',
    isActive: true
  },
  {
    name: 'Washer',
    icon: 'local_laundry_service',
    description: 'Washing machine available',
    slug: 'washer',
    isActive: true
  },
  {
    name: 'Gym',
    icon: 'fitness_center',
    description: 'Fitness center access',
    slug: 'gym',
    isActive: true
  }
];

async function addSampleAmenities() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await db.sequelize.authenticate();
    console.log('Database connected successfully');
    
    // Add sample amenities
    console.log('Adding sample amenities...');
    
    for (const amenity of sampleAmenities) {
      try {
        await db.Amenity.findOrCreate({
          where: { name: amenity.name },
          defaults: amenity
        });
        console.log(`Added or found amenity: ${amenity.name}`);
      } catch (err) {
        console.error(`Error adding amenity ${amenity.name}:`, err.message);
      }
    }
    
    // Count amenities in database
    const count = await db.Amenity.count();
    console.log(`Total amenities in database: ${count}`);
    
    // Get all amenities to verify
    const allAmenities = await db.Amenity.findAll();
    console.log('All amenities in database:');
    allAmenities.forEach(amenity => {
      console.log(`- ${amenity.id}: ${amenity.name}`);
    });
    
    console.log('Done! Sample amenities have been added.');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample amenities:', error);
    process.exit(1);
  }
}

addSampleAmenities(); 