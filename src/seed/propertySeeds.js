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

// Map prédéfinie pour les équipements avec leurs icônes
const AMENITIES = [
  ["wifi", "Connexion Wi-Fi haut débit"],
  ["kitchen", "Cuisine entièrement équipée"],
  ["parking", "Place de parking privée"],
  ["pool", "Piscine"],
  ["air_conditioning", "Climatisation"],
  ["heating", "Chauffage central"],
  ["washer", "Machine à laver"],
  ["dryer", "Sèche-linge"],
  ["tv", "Télévision HD"],
  ["gym", "Salle de sport"]
];

// Define a mapping of amenity names to icon URLs
const iconMap = {
  wifi: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M480-120q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM254-346l-84-86q59-59 138.5-93.5T480-560q92 0 171.5 35T790-430l-84 84q-44-44-102-69t-124-25q-66 0-124 25t-102 69ZM84-516 0-600q92-94 215-147t265-53q142 0 265 53t215 147l-84 84q-77-77-178.5-120.5T480-680q-116 0-217.5 43.5T84-516Z"/></svg>',
  kitchen: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M320-640v-120h80v120h-80Zm0 360v-200h80v200h-80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h480q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80H240Zm0-80h480v-360H240v360Zm0-440h480v-200H240v200Z"/></svg>',
  parking: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M240-120v-720h280q100 0 170 70t70 170q0 100-70 170t-170 70H400v240H240Zm160-400h128q33 0 56.5-23.5T608-600q0-33-23.5-56.5T528-680H400v160Z"/></svg>',
  pool: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M80-120v-80q38 0 57-20t75-20q56 0 77 20t57 20q36 0 57-20t77-20q56 0 77 20t57 20q36 0 57-20t77-20q56 0 75 20t57 20v80q-59 0-77.5-20T748-160q-36 0-57 20t-77 20q-56 0-77-20t-57-20q-36 0-57 20t-77 20q-56 0-77-20t-57-20q-36 0-54.5 20T80-120Zm0-180v-80q38 0 57-20t75-20q56 0 77.5 20t56.5 20q36 0 57-20t77-20q56 0 77 20t57 20q36 0 57-20t77-20q56 0 75 20t57 20v80q-59 0-77.5-20T748-340q-36 0-55.5 20T614-300q-57 0-77.5-20T480-340q-38 0-56.5 20T346-300q-59 0-78.5-20T212-340q-36 0-54.5 20T80-300Zm196-204 133-133-40-40q-33-33-70-48t-91-15v-100q75 0 124 16.5t96 63.5l256 256q-17 11-33 17.5t-37 6.5q-36 0-57-20t-77-20q-56 0-77 20t-57 20q-21 0-37-6.5T276-504Zm392-336q42 0 71 29.5t29 70.5q0 42-29 71t-71 29q-42 0-71-29t-29-71q0-41 29-70.5t71-29.5Z"/></svg>',
  air_conditioning: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M440-80v-166L310-118l-56-56 186-186v-80h-80L174-254l-56-56 128-130H80v-80h166L118-650l56-56 186 186h80v-80L254-786l56-56 130 128v-166h80v166l130-128 56 56-186 186v80h80l186-186 56 56-128 130h166v80H714l128 130-56 56-186-186h-80v80l186 186-56 56-130-128v166h-80Z"/></svg>',
  heating: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M680-520v-120H560v-80h120v-120h80v120h120v80H760v120h-80ZM320-120q-83 0-141.5-58.5T120-320q0-48 21-89.5t59-70.5v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q38 29 59 70.5t21 89.5q0 83-58.5 141.5T320-120Zm-40-440h80v-160q0-17-11.5-28.5T320-760q-17 0-28.5 11.5T280-720v160Z"/></svg>',
  washer: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M165-480 45-688l264-152h51q16 48 38 84t82 36q60 0 82-36t38-84h51l263 153-119 207-75-41v192l-63 55q-3 2-8 5t-9 5v-393l125 69 40-70-153-89q-24 49-70.5 78T480-640q-55 0-101.5-29T308-747l-154 89 41 70 125-69v237q-21 2-41 6.5T240-401v-120l-75 41Zm21 295-52-61 87-74q23-20 52.5-30.5T335-361q32 0 61 10.5t52 30.5l116 99q12 10 28.5 15.5T626-200q18 0 33.5-5t27.5-16l87-75 52 62-87 74q-23 20-52 30t-61 10q-32 0-61.5-10T512-160l-116-99q-12-10-27.5-15.5T335-280q-17 0-33.5 5.5T273-259l-87 74Zm294-455Z"/></svg>',
  dryer: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M280-80v-240h-64q-40 0-68-28t-28-68q0-29 16-53.5t42-36.5l262-116v-26q-36-13-58-43.5T360-760q0-50 35-85t85-35q50 0 85 35t35 85h-80q0-17-11.5-28.5T480-800q-17 0-28.5 11.5T440-760q0 17 11.5 28.5T480-720t28.5 11.5Q520-697 520-680v58l262 116q26 12 42 36.5t16 53.5q0 40-28 68t-68 28h-64v240H280Zm-64-320h64v-40h400v40h64q7 0 11.5-5t4.5-13q0-5-2.5-8.5T750-432L480-552 210-432q-5 2-7.5 5.5T200-418q0 8 4.5 13t11.5 5Zm144 240h240v-200H360v200Zm0-200h240-240Z"/></svg>',
  tv: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M320-120v-80h80v-80H160q-33 0-56.5-23.5T80-360v-400q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v400q0 33-23.5 56.5T800-280H560v80h80v80H320ZM160-360h640v-400H160v400Zm0 0v-400 400Z"/></svg>',
  gym: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="m826-585-56-56 30-31-128-128-31 30-57-57 30-31q23-23 57-22.5t57 23.5l129 129q23 23 23 56.5T857-615l-31 30ZM346-104q-23 23-56.5 23T233-104L104-233q-23-23-23-56.5t23-56.5l30-30 57 57-31 30 129 129 30-31 57 57-30 30Zm397-336 57-57-303-303-57 57 303 303ZM463-160l57-58-302-302-58 57 303 303Zm-6-234 110-109-64-64-109 110 63 63Zm63 290q-23 23-57 23t-57-23L104-406q-23-23-23-57t23-57l57-57q23-23 56.5-23t56.5 23l63 63 110-110-63-62q-23-23-23-57t23-57l57-57q23-23 56.5-23t56.5 23l303 303q23 23 23 56.5T857-441l-57 57q-23 23-57 23t-57-23l-62-63-110 110 63 63q23 23 23 56.5T577-161l-57 57Z"/></svg>'
};

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
      icon: iconMap[name] || "https://example.com/icons/default.png", // Fallback to default icon if not found
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

    // Define image URLs for different property categories
    const PROPERTY_IMAGES = {
      apartment: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267", // Modern apartment interior
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688", // Luxury apartment living room
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2", // Contemporary apartment kitchen
        "https://images.unsplash.com/photo-1484154218962-a197022b5858", // Stylish apartment bedroom
        "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8"  // Modern apartment bathroom
      ],
      house: [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6", // Modern house exterior
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914", // Luxury house facade
        "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83", // Contemporary house design
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750", // Beautiful house architecture
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994"  // Modern home exterior
      ],
      villa: [
        "https://images.unsplash.com/photo-1613977257363-707ba9348227", // Luxury villa exterior
        "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4", // Villa with pool
        "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c5", // Villa interior
        "https://images.unsplash.com/photo-1613977257363-707ba9348228", // Villa bedroom
        "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c6"  // Villa living room
      ]
    };

    // Create photos for each listing before creating rules
    const photos = createdListings.flatMap((listing, listingIndex) => {
      // Get the property type name
      const propertyType = PROPERTY_TYPES.get(listing.propertyTypeId);
      
      // Select appropriate image array based on property type, default to apartment if not found
      const imageArray = PROPERTY_IMAGES[propertyType] || PROPERTY_IMAGES.apartment;
      
      // Create multiple photos per listing using the selected image array
      return imageArray.map((imageUrl, index) => ({
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

