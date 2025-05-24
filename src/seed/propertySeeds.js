const { faker } = require('@faker-js/faker');
const { 
  Listing, 
  Photo, 
  Location, 
  PropertyType, 
  PropertyRule, 
  Amenity, 
  Category,
  ListingAmenities 
} = require('../models');

// Map prédéfinie pour les types de chambres
const ROOM_TYPES = new Map([
  ['single_room', 'Chambre simple avec un lit simple'],
  ['double_room', 'Chambre double avec un grand lit'],
  ['twin_room', 'Chambre avec deux lits simples'],
  ['suite', 'Suite luxueuse avec salon séparé'],
  ['family_room', 'Grande chambre adaptée aux familles'],
  ['master_bedroom', 'Chambre principale avec salle de bain privative'],
  ['studio', 'Studio avec coin cuisine'],
  ['deluxe_room', 'Chambre deluxe avec équipements premium'],
  ['executive_room', 'Chambre executive avec espace de travail'],
  ['penthouse', 'Suite penthouse au dernier étage']
]);

// Map prédéfinie pour les types de propriétés
const PROPERTY_TYPES = new Map([
  ['apartment', 'Appartement moderne avec commodités standard'],
  ['house', 'Maison individuelle avec jardin'],
  ['villa', 'Villa luxueuse avec piscine privée'],
  ['studio', 'Studio compact et fonctionnel'],
  ['loft', 'Loft industriel converti'],
  ['cottage', 'Cottage traditionnel avec charme rustique'],
  ['bungalow', 'Bungalow de plain-pied'],
  ['townhouse', 'Maison de ville sur plusieurs étages'],
  ['cabin', 'Cabine confortable en nature'],
  ['other', 'Autre type de logement']
]);

// Map prédéfinie pour les catégories
const CATEGORIES = new Map([
  ['beachfront', 'Propriétés en bord de mer avec accès direct à la plage'],
  ['mountain_view', 'Propriétés avec vue sur la montagne'],
  ['city_center', 'Logements au cœur de la ville'],
  ['countryside', 'Propriétés rurales et champêtres'],
  ['lakefront', 'Propriétés au bord du lac'],
  ['historic', 'Bâtiments historiques et patrimoniaux'],
  ['modern', 'Propriétés contemporaines et modernes'],
  ['luxury', 'Hébergements haut de gamme'],
  ['eco_friendly', 'Logements écologiques'],
  ['family_friendly', 'Propriétés adaptées aux familles']
]);

// Map prédéfinie pour les équipements
const AMENITIES = new Map([
  ['wifi', 'Connexion Wi-Fi haut débit'],
  ['kitchen', 'Cuisine entièrement équipée'],
  ['parking', 'Place de parking privée'],
  ['pool', 'Piscine'],
  ['air_conditioning', 'Climatisation'],
  ['heating', 'Chauffage central'],
  ['washer', 'Machine à laver'],
  ['dryer', 'Sèche-linge'],
  ['tv', 'Télévision HD'],
  ['gym', 'Salle de sport']
]);

async function seedProperty() {
  try {
    // Clean existing data
    await Listing.destroy({ where: {}, force: true });
    await Photo.destroy({ where: {}, force: true });
    await PropertyRule.destroy({ where: {}, force: true });
    await ListingAmenities.destroy({ where: {}, force: true });
    await PropertyType.destroy({ where: {}, force: true });
    await Category.destroy({ where: {}, force: true });
    await Amenity.destroy({ where: {}, force: true });
    await Location.destroy({ where: {}, force: true });

    // Create property types
    const propertyTypes = await PropertyType.bulkCreate([
      { name: 'House', icon: 'home' },
      { name: 'Apartment', icon: 'apartment' },
      { name: 'Villa', icon: 'villa' },
      { name: 'Condo', icon: 'apartment' }
    ]);

    // Create categories
    const categories = await Category.bulkCreate([
      { name: 'Beach', description: 'Beachfront properties', icon: 'beach_access' },
      { name: 'Mountain', description: 'Mountain view properties', icon: 'landscape' },
      { name: 'City', description: 'Urban properties', icon: 'location_city' }
    ]);

    // Create amenities
    const amenities = await Amenity.bulkCreate([
      { name: 'WiFi', description: 'Free WiFi', icon: 'wifi' },
      { name: 'Pool', description: 'Swimming pool', icon: 'pool' },
      { name: 'Kitchen', description: 'Full kitchen', icon: 'kitchen' },
      { name: 'Parking', description: 'Free parking', icon: 'local_parking' }
    ]);

    // Create locations
    const locations = await Location.bulkCreate([
      { 
        name: 'Miami Beach',
        description: 'Beautiful beachfront location',
        slug: 'miami-beach',
        isActive: true
      },
      {
        name: 'Aspen',
        description: 'Mountain resort town',
        slug: 'aspen',
        isActive: true
      },
      {
        name: 'New York City',
        description: 'Urban center',
        slug: 'new-york-city',
        isActive: true
      }
    ]);

    // Create sample listings
    const listings = await Listing.bulkCreate([
      {
        title: 'Beachfront Villa',
        description: 'Luxurious beachfront villa with ocean views',
        propertyTypeId: propertyTypes[2].id, // Villa
        categoryId: categories[0].id, // Beach
        locationId: locations[0].id, // Miami Beach
        hostId: 2, // Assuming host user ID is 2
        status: 'published',
        pricePerNight: 500,
        bedrooms: 4,
        bathrooms: 3,
        beds: 6,
        accommodates: 8,
        isActive: true,
        stepStatus: {
          basicInfo: true,
          location: true,
          details: true,
          pricing: true,
          photos: true,
          rules: true,
          calendar: true
        }
      },
      {
        title: 'Mountain View Cabin',
        description: 'Cozy cabin with stunning mountain views',
        propertyTypeId: propertyTypes[0].id, // House
        categoryId: categories[1].id, // Mountain
        locationId: locations[1].id, // Aspen
        hostId: 2, // Assuming host user ID is 2
        status: 'published',
        pricePerNight: 300,
        bedrooms: 3,
        bathrooms: 2,
        beds: 4,
        accommodates: 6,
        isActive: true,
        stepStatus: {
          basicInfo: true,
          location: true,
          details: true,
          pricing: true,
          photos: true,
          rules: true,
          calendar: true
        }
      }
    ]);

    // Create photos for listings
    await Photo.bulkCreate([
      {
        listingId: listings[0].id,
        url: 'http://localhost:3000/uploads/sample-beach-villa.jpg',
        isCover: true,
        caption: 'Beachfront view',
        displayOrder: 1
      },
      {
        listingId: listings[1].id,
        url: 'http://localhost:3000/uploads/sample-mountain-cabin.jpg',
        isCover: true,
        caption: 'Mountain view',
        displayOrder: 1
      }
    ]);

    // Create property rules
    await PropertyRule.bulkCreate([
      {
        listingId: listings[0].id,
        type: 'other',
        title: 'No smoking',
        description: 'Smoking is not allowed on the property',
        isAllowed: false,
        isActive: true,
        displayOrder: 1
      },
      {
        listingId: listings[1].id,
        type: 'other',
        title: 'No pets',
        description: 'Pets are not allowed',
        isAllowed: false,
        isActive: true,
        displayOrder: 1
      }
    ]);

    // Create listing-amenity relationships
    await ListingAmenities.bulkCreate([
      { listingId: listings[0].id, amenityId: amenities[0].id }, // WiFi
      { listingId: listings[0].id, amenityId: amenities[1].id }, // Pool
      { listingId: listings[1].id, amenityId: amenities[0].id }, // WiFi
      { listingId: listings[1].id, amenityId: amenities[2].id }  // Kitchen
    ]);

    console.log('✅ Property models seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding property models:', error);
    throw error;
  }
}

// seedProperty()
async function logSeededListings() {
  try {
    const listings = await Listing.scope('all').findAll({ raw: true })
    
    console.log(`✅ Seeded Listings Count: ${listings.length}`);
    
    if (listings.length > 0) {
      console.log('📋 Listings Details:', listings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        address: listing.address,
        locationId: listing.locationId,
        hostId: listing.hostId,
      })));
    } else {
      console.warn('⚠️ No listings found. Please check your seeder.');
    }
  } catch (error) {
    console.error('❌ Error fetching seeded listings:', error.message);
  }
}
// seedProperty()
// logSeededListings();
module.exports = seedProperty;


