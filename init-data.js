require('dotenv').config();
const db = require('./src/models');

async function initializeAmenities() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();
    console.log('Database connected successfully!');
    
    console.log('Creating amenities...');
    const amenities = [
      { name: 'Wi-Fi', icon: 'wifi', description: 'High-speed wireless internet', slug: 'wifi' },
      { name: 'Kitchen', icon: 'kitchen', description: 'Space with stove and appliances', slug: 'kitchen' },
      { name: 'Air conditioning', icon: 'ac_unit', description: 'Central or unit-based cooling', slug: 'air-conditioning' },
      { name: 'TV', icon: 'tv', description: 'Television with standard channels', slug: 'tv' },
      { name: 'Washer', icon: 'local_laundry_service', description: 'In-unit washing machine', slug: 'washer' },
      { name: 'Pool', icon: 'pool', description: 'Private or shared swimming pool', slug: 'pool' },
      { name: 'Free parking', icon: 'local_parking', description: 'Free parking on premises', slug: 'free-parking' },
      { name: 'Gym', icon: 'fitness_center', description: 'Fitness equipment or room', slug: 'gym' },
      { name: 'Heating', icon: 'whatshot', description: 'Central or room heating', slug: 'heating' }
    ];
    
    // Create amenities with unique constraint handling
    for (const amenity of amenities) {
      try {
        await db.Amenity.create(amenity);
        console.log(`Created amenity: ${amenity.name}`);
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          console.log(`Amenity '${amenity.name}' already exists, skipping.`);
        } else {
          console.error(`Error creating amenity '${amenity.name}':`, error);
        }
      }
    }
    
    const count = await db.Amenity.count();
    console.log(`Total amenities in database: ${count}`);
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing amenities:', error);
    process.exit(1);
  }
}

initializeAmenities(); 