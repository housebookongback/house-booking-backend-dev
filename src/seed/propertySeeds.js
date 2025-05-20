const { faker } = require('@faker-js/faker');
const db = require('../models')

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

async function seedPropertyModels() {
  try {
    // Clean existing data
    await db.PropertyAvailability.destroy({ where: {}, force: true });
    await db.PropertyPolicy.destroy({ where: {}, force: true });
    await db.PropertyRule.destroy({ where: {}, force: true });
    await db.Photo.destroy({ where: {}, force: true });
    await db.ListingAmenities.destroy({ where: {}, force: true });
    await db.Listing.destroy({ where: {}, force: true });
    await db.Amenity.destroy({ where: {}, force: true });
    await db.Location.destroy({ where: {}, force: true });
    await db.Category.destroy({ where: {}, force: true });
    await db.RoomType.destroy({ where: {}, force: true });
    await db.PropertyType.destroy({ where: {}, force: true });

    // Seed PropertyTypes
    // Seed PropertyTypes with predefined values
    const propertyTypes = Array.from(PROPERTY_TYPES, ([name, description]) => ({
      name,
      description,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const createdPropertyTypes = await db.PropertyType.bulkCreate(propertyTypes, {
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

    await db.RoomType.bulkCreate(roomTypes, {
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

    await db.Category.bulkCreate(categories);

    // Seed Locations
    const locations = Array.from({ length: 10 }).map(() => ({
      name: faker.location.city(),
      type: faker.helpers.arrayElement(['city', 'region', 'country']),
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const createdLocations = await db.Location.bulkCreate(locations);

    // Seed Amenities
    // Seed Amenities avec des noms uniques
    const amenities = Array.from(AMENITIES, ([name, description]) => ({
      name,
      description,
      icon: faker.image.url(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const createdAmenities = await db.Amenity.bulkCreate(amenities, {
      ignoreDuplicates: true
    });

    // Seed Listings
    // Récupérer les IDs des hôtes existants
    const existingHosts = await db.HostProfile.findAll({ 
      paranoid: false,
      include: [{
        model: db.User,
        as: 'user'
      }]
    });

    if (existingHosts.length === 0) {
      throw new Error('Aucun hôte trouvé. Veuillez d\'abord exécuter le seed des hôtes.');
    }

    // Seed Listings avec hostId valide
    const listings = Array.from({ length: 10 }).map(() => {
      const selectedHost = faker.helpers.arrayElement(existingHosts);
      const selectedLocation = faker.helpers.arrayElement(createdLocations);
      const title = faker.lorem.sentence();
      return {
        userId: selectedHost.userId,
        hostId: selectedHost.userId,
        propertyTypeId: faker.helpers.arrayElement(createdPropertyTypes).id,
        locationId: selectedLocation.id,
        title: title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
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
        status: 'draft', // Keep as draft until all required data is set
        instantBookable: false,
        minimumNights: faker.number.int({ min: 1, max: 3 }),
        maximumNights: faker.number.int({ min: 7, max: 30 }),
        cancellationPolicy: faker.helpers.arrayElement(['flexible', 'moderate', 'strict']),
        views: 0,
        reviewCount: 0,
        stepStatus: {
          basicInfo: false,
          location: false,
          details: false,
          pricing: false,
          photos: false,
          rules: false,
          calendar: false
        },
        defaultAvailability: true,
        checkInDays: [0,1,2,3,4,5,6],
        checkOutDays: [0,1,2,3,4,5,6],
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    const createdListings = await db.Listing.bulkCreate(listings);

    // Create photos for each listing before creating rules
    const photos = createdListings.flatMap((listing, listingIndex) => {
      // Create multiple photos per listing
      return Array.from({ length: faker.number.int({ min: 3, max: 8 }) }).map((_, index) => ({
        id: listingIndex * 100 + index + 1, // Génère un ID unique pour chaque photo
        listingId: listing.id,
        url: faker.image.url(),
        thumbnailUrl: faker.image.url(),
        fileType: 'image/jpeg',
        fileSize: faker.number.int({ min: 500000, max: 5000000 }),
        width: 1920,
        height: 1080,
        caption: faker.lorem.sentence(),
        category: faker.helpers.arrayElement(['exterior', 'interior', 'bedroom', 'bathroom', 'kitchen', 'living_room', 'view']),
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

    // Create property rules
    const propertyRules = createdListings.flatMap(listing => {
      const ruleTypes = [
        'check_in',
        'check_out',
        'quiet_hours',
        'smoking',
        'pets',
        'parties',
        'children',
        'visitors',
        'parking',
        'amenities',
        'safety',
        'other'
      ];

      return ruleTypes.map((type, index) => ({
        listingId: listing.id,
        type: type,
        title: `${faker.word.adjective()} ${type.replace('_', ' ')} rule`,
        description: faker.lorem.paragraph(),
        isAllowed: faker.datatype.boolean(),
        restrictions: {
          timeRestrictions: type === 'quiet_hours' ? {
            start: '22:00',
            end: '08:00'
          } : null,
          ageRestrictions: type === 'children' ? {
            minimumAge: faker.number.int({ min: 0, max: 18 })
          } : null,
          maxCapacity: type === 'visitors' ? {
            daytime: faker.number.int({ min: 1, max: 10 }),
            overnight: faker.number.int({ min: 0, max: 5 })
          } : null
        },
        penalty: faker.datatype.boolean() ? `$${faker.number.int({ min: 50, max: 500 })} fee` : null,
        isActive: true,
        displayOrder: index,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    });

    await db.PropertyRule.bulkCreate(propertyRules);

    // Now update listings to published status after rules are created
    await Promise.all(createdListings.map(listing => 
      listing.update({
        status: 'published',
        stepStatus: {
          basicInfo: true,
          location: true,
          details: true,
          pricing: true,
          photos: true,
          rules: true,
          calendar: true
        }
      })
    ));

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

    await db.ListingAmenities.bulkCreate(listingAmenities);

    // Seed PropertyAvailability
    const propertyAvailabilities = [];
    for (const listing of createdListings) {
      // Create availability entries for the next 90 days
      const startDate = new Date();
      for (let i = 0; i < 90; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        propertyAvailabilities.push({
          listingId: listing.id,
          date: date,
          isAvailable: faker.datatype.boolean(),
          price: parseFloat(faker.number.float({ 
            min: listing.pricePerNight, 
            max: listing.pricePerNight * 1.5, 
            precision: 0.01 
          })).toFixed(2),
          minimumNights: faker.number.int({ min: 1, max: 3 }),
          maximumNights: faker.number.int({ min: 7, max: 30 }),
          checkInTime: '15:00',
          checkOutTime: '11:00',
          notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await db.PropertyAvailability.bulkCreate(propertyAvailabilities);

    // Seed PropertyPolicy
    const propertyPolicies = createdListings.flatMap(listing => {
      const policyTypes = [
        'cancellation',
        'refund',
        'house_rules',
        'check_in',
        'check_out',
        'security_deposit',
        'cleaning',
        'damage',
        'liability',
        'insurance'
      ];

      return policyTypes.map((type, index) => ({
        listingId: listing.id,
        type: type,
        title: `${faker.word.adjective()} ${type.replace('_', ' ')} policy`,
        description: faker.lorem.paragraph(),
        terms: {
          conditions: faker.lorem.sentences(3),
          restrictions: faker.lorem.sentences(2)
        },
        conditions: {
          timeLimit: faker.number.int({ min: 24, max: 72 }),
          requirements: faker.lorem.sentences(2)
        },
        exceptions: {
          cases: faker.lorem.sentences(2),
          specialCircumstances: faker.lorem.sentence()
        },
        lastUpdated: new Date(),
        version: '1.0',
        isActive: true,
        requiresAgreement: faker.datatype.boolean(),
        displayOrder: index,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    });

    await db.PropertyPolicy.bulkCreate(propertyPolicies);

    console.log('Property models seeded successfully');
  } catch (error) {
    console.error('Error seeding property models:', error);
    throw error;
  }
}
// seedPropertyModels()
module.exports = seedPropertyModels;


