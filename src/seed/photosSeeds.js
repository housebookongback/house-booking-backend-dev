const { faker } = require('@faker-js/faker');
const db = require('../models');

// Define image URLs for apartments and houses with 20 images each
const PROPERTY_IMAGES = {
  apartment: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267", // Modern apartment interior
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688", // Luxury apartment living room
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2", // Contemporary apartment kitchen
    "https://images.unsplash.com/photo-1484154218962-a197022b5858", // Stylish apartment bedroom
    "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8", // Modern apartment bathroom
    "https://images.unsplash.com/photo-1499955085172-eeb4755d6df8", // Cozy apartment living area
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511", // Minimalist apartment interior
    "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af", // Bright apartment bedroom
    "https://images.unsplash.com/photo-1496664444929-8c75efb9546f", // Modern apartment with open space
    "https://images.unsplash.com/photo-1513694203232-719a280e022f", // Stylish apartment decor
    "https://images.unsplash.com/photo-1501183638710-8415d6708c8b", // Apartment with city view
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00", // Modern apartment kitchen
    "https://images.unsplash.com/photo-1533090481720-856c6d3d8840", // Cozy apartment nook
    "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4", // Apartment with natural light
    "https://images.unsplash.com/photo-1507089947368-8c4f8e0a4c96", // Urban apartment interior
    "https://images.unsplash.com/photo-1515263487990-61b07816b324", // Apartment balcony view
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb", // Modern apartment dining area
    "https://images.unsplash.com/photo-1522444195799-4787b39e2c45", // Small apartment bedroom
    "https://images.unsplash.com/photo-1534889156217-d643df5f7f1c", // Apartment with modern furniture
    "https://images.unsplash.com/photo-1502672023488-70e25813eb80"  // Chic apartment living room
  ],
  house: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6", // Modern house exterior
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914", // Luxury house facade
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83", // Contemporary house design
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750", // Beautiful house architecture
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994", // Modern home exterior
    "https://images.unsplash.com/photo-1576941089067-2de3c901e293", // Spacious house interior
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c", // Modern house with pool
    "https://images.unsplash.com/photo-1600607688960-5760b9f9a1b2", // Cozy house living room
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d", // House with modern kitchen
    "https://images.unsplash.com/photo-1572120361638-6f386cff7336", // Traditional house exterior
    "https://images.unsplash.com/photo-1600585153490-6e5d8d63d6a6", // House with large windows
    "https://images.unsplash.com/photo-1592595896551-12b371d546d5", // Modern house bedroom
    "https://images.unsplash.com/photo-1600585152915-18c312714df4", // House with outdoor patio
    "https://images.unsplash.com/photo-1600585153780-4e5b9c7a4b45", // Contemporary house interior
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c", // House with open floor plan
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d", // House with stylish decor
    "https://images.unsplash.com/photo-1600585152915-18c312714df4", // House with garden view
    "https://images.unsplash.com/photo-1600585153490-6e5b8d63d6a6", // House with modern bathroom
    "https://images.unsplash.com/photo-1600585153780-4e5b9c7a4b45", // House with cozy fireplace
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"  // House with spacious living area
  ]
};

async function seedPhotos() {
  try {
    // Clean existing photos
    await db.Photo.destroy({ where: {}, force: true });

    // Get existing listings
    const createdListings = await db.Listing.findAll();
    
    if (createdListings.length === 0) {
      throw new Error('No listings found. Please seed listings first.');
    }

    if (createdListings.length !== 71) {
      console.warn(`Expected 71 listings, found ${createdListings.length}. Seeding photos for ${createdListings.length} listings.`);
    }

    // Create photos for each listing
    const photos = createdListings.flatMap((listing, listingIndex) => {
      // Get the property type name (ensure it maps to 'apartment' or 'house')
      const propertyType = listing.propertyTypeId === 'apartment' || listing.propertyTypeId === 'house' 
        ? listing.propertyTypeId 
        : faker.helpers.arrayElement(['apartment', 'house']);
      
      // Select image array based on property type
      const imageArray = PROPERTY_IMAGES[propertyType];
      
      // Randomly select 5 unique images from the array to avoid repetition within a listing
      const selectedImages = faker.helpers.shuffle([...imageArray]).slice(0, 5);
      
      // Create 5 photos per listing using the selected images
      return selectedImages.map((imageUrl, index) => ({
        id: listingIndex * 100 + index + 1,
        listingId: listing.id,
        url: imageUrl,
        thumbnailUrl: imageUrl,
        fileType: 'image/jpeg',
        fileSize: faker.number.int({ min: 500000, max: 5000000 }),
        width: 1920,
        height: 1080,
        caption: faker.lorem.sentence(),
        category: faker.helpers.arrayElement(['exterior', 'interior', 'bedroom', 'bathroom', 'kitchen', 'living_room']),
        isCover: index === 0,
        displayOrder: index,
        status: 'approved',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    });

    await db.Photo.bulkCreate(photos, {
      ignoreDuplicates: true
    });

    console.log(`Successfully seeded ${photos.length} photos for ${createdListings.length} listings`);
  } catch (error) {
    console.error('Error seeding photos:', error);
    throw error;
  }
}
seedPhotos()
module.exports = seedPhotos;