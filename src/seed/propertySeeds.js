const { faker } = require('@faker-js/faker');
const sequelize = require('../models').sequelize.models;

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
  ['penthouse', 'Penthouse avec vue panoramique'],
  ['bungalow', 'Bungalow de plain-pied'],
  ['townhouse', 'Maison de ville sur plusieurs étages'],
  ['chalet', 'Chalet de montagne traditionnel']
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

async function seedPropertyModels() {
  try {
    // Clean existing data
    await sequelize.PropertyAvailability.destroy({ where: {}, force: true });
    await sequelize.PropertyPolicy.destroy({ where: {}, force: true });
    await sequelize.PropertyRule.destroy({ where: {}, force: true });
    await sequelize.Photo.destroy({ where: {}, force: true });
    await sequelize.ListingAmenities.destroy({ where: {}, force: true });
    await sequelize.Listings.destroy({ where: {}, force: true });
    await sequelize.Amenity.destroy({ where: {}, force: true });
    await sequelize.Location.destroy({ where: {}, force: true });
    await sequelize.Category.destroy({ where: {}, force: true });
    await sequelize.RoomType.destroy({ where: {}, force: true });
    await sequelize.PropertyType.destroy({ where: {}, force: true });

    // Seed PropertyTypes
    // Seed PropertyTypes with predefined values
    const propertyTypes = Array.from(PROPERTY_TYPES, ([name, description]) => ({
      name,
      description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const createdPropertyTypes = await sequelize.PropertyType.bulkCreate(propertyTypes, {
      ignoreDuplicates: true
    });

    // Seed RoomTypes
    // Seed RoomTypes avec des noms uniques
    const roomTypes = Array.from(ROOM_TYPES, ([name, description]) => ({
      name,
      description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await sequelize.RoomType.bulkCreate(roomTypes, {
      ignoreDuplicates: true
    });

    // Seed Categories
    // Seed Categories avec des noms uniques
    const categories = Array.from(CATEGORIES, ([name, description]) => ({
      name,
      description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await sequelize.Category.bulkCreate(categories);

    // Seed Locations
    const locations = Array.from({ length: 10 }).map(() => ({
      name: faker.location.city(),
      type: faker.helpers.arrayElement(['city', 'region', 'country']),
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const createdLocations = await sequelize.Location.bulkCreate(locations);

    // Seed Amenities
    // Seed Amenities avec des noms uniques
    const amenities = Array.from(AMENITIES, ([name, description]) => ({
      name,
      description,
      icon: faker.image.url(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const createdAmenities = await sequelize.Amenity.bulkCreate(amenities, {
      ignoreDuplicates: true
    });

    // Seed Listings
    // Récupérer les IDs des hôtes existants
    const existingHosts = await sequelize.HostProfile.findAll({
      attributes: ['id'],
      include: [{
        model: sequelize.User,
        as: 'user',
        attributes: ['id'],
        required: true
      }]
    });

    if (existingHosts.length === 0) {
      throw new Error('Aucun hôte trouvé. Veuillez d\'abord exécuter le seed des hôtes.');
    }

    // Seed Listings avec hostId valide
    const listings = Array.from({ length: 10 }).map(() => {
      const selectedHost = faker.helpers.arrayElement(existingHosts);
      const selectedLocation = faker.helpers.arrayElement(createdLocations);
      return {
        userId: selectedHost.user.id,
        hostId: selectedHost.user.id,
        propertyTypeId: faker.helpers.arrayElement(createdPropertyTypes).id,
        locationId: selectedLocation.id,
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        address: faker.location.streetAddress(true),
        coordinates: `${selectedLocation.latitude},${selectedLocation.longitude}`,
        price: faker.number.float({ min: 50, max: 1000 }),
        pricePerNight: faker.number.float({ min: 50, max: 500 }),
        bedrooms: faker.number.int({ min: 1, max: 5 }),
        bathrooms: faker.number.int({ min: 1, max: 3 }),
        maxGuests: faker.number.int({ min: 1, max: 10 }),
        accommodates: faker.number.int({ min: 1, max: 10 }),
        beds: faker.number.int({ min: 1, max: 8 }),
        isActive: true,
        status: 'draft',
        instantBookable: false,
        minimumNights: 1,
        cancellationPolicy: 'moderate',
        views: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    const createdListings = await sequelize.Listings.bulkCreate(listings);

    // Seed ListingAmenities
    const listingAmenities = createdListings.flatMap(listing => 
      faker.helpers.arrayElements(createdAmenities, faker.number.int({ min: 3, max: 8 }))
        .map(amenity => ({
          listingId: listing.id,
          amenityId: amenity.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
    );

    await sequelize.ListingAmenities.bulkCreate(listingAmenities);

    console.log('Property models seeded successfully');
  } catch (error) {
    console.error('Error seeding property models:', error);
    throw error;
  }
}

// seedPropertyModels()
// async function logSeededListings() {
//   try {
//     const listings = await sequelize.Listings.scope('all').findAll({ raw: true })
    
//     console.log(`✅ Seeded Listings Count: ${listings.length}`);
    
//     if (listings.length > 0) {
//       console.log('📋 Listings Details:', listings.map((listing) => ({
//         id: listing.id,
//         title: listing.title,
//         address: listing.address,
//         locationId: listing.locationId,
//         hostId: listing.hostId,
//       })));
//     } else {
//       console.warn('⚠️ No listings found. Please check your seeder.');
//     }
//   } catch (error) {
//     console.error('❌ Error fetching seeded listings:', error.message);
//   }
// }
// seedPropertyModels()

module.exports = seedPropertyModels;


