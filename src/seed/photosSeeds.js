const { faker } = require('@faker-js/faker');
const db = require('../models');

const PROPERTY_IMAGES = {
  apartment: [
    "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/206172/pexels-photo-206172.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/208736/pexels-photo-208736.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/323775/pexels-photo-323775.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/323772/pexels-photo-323772.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/53610/large-home-residential-house-architecture-53610.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/221024/pexels-photo-221024.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/323776/pexels-photo-323776.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/164522/pexels-photo-164522.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/259685/pexels-photo-259685.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/2893177/pexels-photo-2893177.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/210538/pexels-photo-210538.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/1694360/pexels-photo-1694360.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/950058/pexels-photo-950058.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
  ]
};

const ROOM_IMAGES = {
    interior: [
      "https://images.pexels.com/photos/827518/pexels-photo-827518.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      "https://images.pexels.com/photos/1571452/pexels-photo-1571452.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      "https://images.pexels.com/photos/271795/pexels-photo-271795.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    ],
    bedroom: [
      "https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      "https://images.pexels.com/photos/1034584/pexels-photo-1034584.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      "https://images.pexels.com/photos/3144580/pexels-photo-3144580.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    ],
    bathroom: [
      "https://images.pexels.com/photos/1454804/pexels-photo-1454804.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      "https://images.pexels.com/photos/1910472/pexels-photo-1910472.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      "https://images.pexels.com/photos/105934/pexels-photo-105934.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    ],
    kitchen: [
      "https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      "https://images.pexels.com/photos/2089698/pexels-photo-2089698.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      "https://images.pexels.com/photos/5824485/pexels-photo-5824485.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    ],
    living_room: [
      "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      "https://images.pexels.com/photos/1669799/pexels-photo-1669799.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    ]
  };
  
  function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  
  async function seedPhotos() {
    try {
      await db.Photo.destroy({ where: {}, force: true });
  
      const createdListings = await db.Listing.findAll();
      if (createdListings.length === 0) {
        throw new Error('No listings found. Please seed listings first.');
      }
  
      const photos = createdListings.flatMap((listing, listingIndex) => {
        const baseId = listingIndex * 100;
  
        const coverUrl = getRandomItem(PROPERTY_IMAGES.apartment);
  
        // Cover photo
        const coverPhoto = {
          id: baseId + 1,
          listingId: listing.id,
          url: coverUrl,
          thumbnailUrl: coverUrl,
          fileType: 'image/jpeg',
          fileSize: faker.number.int({ min: 500_000, max: 5_000_000 }),
          width: 1920,
          height: 1080,
          caption: faker.lorem.sentence(),
          category: 'exterior',
          isCover: true,
          displayOrder: 0,
          status: 'approved',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
  
        // Room photos
        const roomPhotos = Object.entries(ROOM_IMAGES).map(([room, urls], i) => {
          const roomUrl = getRandomItem(urls);
          return {
            id: baseId + i + 2,
            listingId: listing.id,
            url: roomUrl,
            thumbnailUrl: roomUrl,
            fileType: 'image/jpeg',
            fileSize: faker.number.int({ min: 500_000, max: 5_000_000 }),
            width: 1920,
            height: 1080,
            caption: `Nice ${room.replace('_', ' ')} view`,
            category: room,
            isCover: false,
            displayOrder: i + 1,
            status: 'approved',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        });
  
        return [coverPhoto, ...roomPhotos];
      });
  
      await db.Photo.bulkCreate(photos, { ignoreDuplicates: true });
      console.log(`✅ Seeded ${photos.length} photos for ${createdListings.length} listings.`);
    } catch (error) {
      console.error('❌ Error seeding photos:', error);
      throw error;
    }
  }
  
  seedPhotos();
  module.exports = seedPhotos;