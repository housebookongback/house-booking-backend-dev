const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('./models/index')

const sequelize=require('./models/index')
console.log("dbbbbbbbbbbbb sqqqqqqqqqqqqqqq",db.sequelize.models)
// Main seeding function
async function seed(sequelize) {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Clear existing data
    await clearExistingData(sequelize);
    
    // Seed data in order of dependencies
    const roles = await seedRoles(sequelize);
    const users = await seedUsers(sequelize);
    await seedUserRoles(sequelize, users, roles);
    
    const propertyTypes = await seedPropertyTypes(sequelize);
    const roomTypes = await seedRoomTypes(sequelize);
    const categories = await seedCategories(sequelize);
    const locations = await seedLocations(sequelize);
    
    const hostProfiles = await seedHostProfiles(sequelize, users);
    const guestProfiles = await seedGuestProfiles(sequelize, users);
    
    const listings = await seedListings(sequelize, hostProfiles, propertyTypes, roomTypes, categories, locations);
    const amenities = await seedAmenities(sequelize);
    
    await seedListingAmenities(sequelize, listings, amenities);
    await seedPhotos(sequelize, listings);
    await seedPropertyRules(sequelize, listings);
    await seedPropertyPolicies(sequelize, listings);
    await seedPropertyAvailability(sequelize, listings);
    await seedPriceRules(sequelize, listings);
    await seedSeasonalPricing(sequelize, listings);
    
    const bookings = await seedBookings(sequelize, listings, guestProfiles, hostProfiles);
    await seedBookingCalendars(sequelize, listings);
    await seedReviews(sequelize, bookings, users);
    await seedReports(sequelize, users, listings);
    
    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during database seeding:', error);
    throw error;
  }
}

// Helper function to clear existing data
async function clearExistingData(sequelize) {
  try {
    // Delete in reverse order of dependencies
    await db.sequelize.models.Report?.destroy({ where: {} }).catch(e => console.log('No Report model found'));
    await db.sequelize.models.Review?.destroy({ where: {} }).catch(e => console.log('No Review model found'));
    await db.sequelize.models.BookingCalendar?.destroy({ where: {} }).catch(e => console.log('No BookingCalendar model found'));
    await db.sequelize.models.Booking?.destroy({ where: {} }).catch(e => console.log('No Booking model found'));
    await db.sequelize.models.SeasonalPricing?.destroy({ where: {} }).catch(e => console.log('No SeasonalPricing model found'));
    await db.sequelize.models.PriceRule?.destroy({ where: {} }).catch(e => console.log('No PriceRule model found'));
    await db.sequelize.models.PropertyAvailability?.destroy({ where: {} }).catch(e => console.log('No PropertyAvailability model found'));
    await db.sequelize.models.PropertyPolicy?.destroy({ where: {} }).catch(e => console.log('No PropertyPolicy model found'));
    await db.sequelize.models.PropertyRule?.destroy({ where: {} }).catch(e => console.log('No PropertyRule model found'));
    await db.sequelize.models.Photo?.destroy({ where: {} }).catch(e => console.log('No Photo model found'));
    await db.sequelize.models.ListingAmenity?.destroy({ where: {} }).catch(e => console.log('No ListingAmenity model found'));
    await db.sequelize.models.Amenity?.destroy({ where: {} }).catch(e => console.log('No Amenity model found'));
    await db.sequelize.models.Listing?.destroy({ where: {} }).catch(e => console.log('No Listing model found'));
    await db.sequelize.models.GuestProfile?.destroy({ where: {} }).catch(e => console.log('No GuestProfile model found'));
    await db.sequelize.models.HostProfile?.destroy({ where: {} }).catch(e => console.log('No HostProfile model found'));
    await db.sequelize.models.Location?.destroy({ where: {} }).catch(e => console.log('No Location model found'));
    await db.sequelize.models.Category?.destroy({ where: {} }).catch(e => console.log('No Category model found'));
    await db.sequelize.models.RoomType?.destroy({ where: {} }).catch(e => console.log('No RoomType model found'));
    await db.sequelize.models.PropertyType?.destroy({ where: {} }).catch(e => console.log('No PropertyType model found'));
    await db.sequelize.models.UserRoles?.destroy({ where: {} }).catch(e => console.log('No UserRoles model found'));
    await db.sequelize.models.User?.destroy({ where: {} }).catch(e => console.log('No User model found'));
    await db.sequelize.models.Role?.destroy({ where: {} }).catch(e => console.log('No Role model found'));
    await db.sequelize.models.PropertyType.destroy({
        where: {},
        truncate: true,
        restartIdentity: true, // Resets the primary key sequence
        cascade: true
      });
    console.log('🧹 Cleared existing data');
  } catch (error) {
    console.error('Error clearing existing data:', error);
    throw error;
  }
}

// Seed Roles
async function seedRoles(sequelize, count = 3) {
  try {
    const roleNames = ['user', 'host', 'admin'];
    
    const roles = roleNames.map(roleName => ({
      name: roleName,
      description: faker.lorem.sentence(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const createdRoles = await db.sequelize.models.Role.bulkCreate(roles);
    console.log(`✅ Created ${createdRoles.length} roles`);
    return createdRoles;
  } catch (error) {
    console.error('Error seeding roles:', error);
    throw error;
  }
}

// Seed Users
async function seedUsers(sequelize, count = 10) {
  try {
    const users = Array.from({ length: count }).map(() => {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(faker.internet.password(), salt);
      
      return {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        passwordHash,
        phone: faker.phone.number(),
        isVerified: faker.datatype.boolean(),
        emailVerifiedAt: faker.datatype.boolean() ? faker.date.recent() : null,
        emailVerificationToken: crypto.randomUUID(),
        passwordResetToken: crypto.randomUUID(),
        passwordResetExpires: faker.date.recent(),
        profilePicture: faker.image.avatar(),
        bio: faker.lorem.sentence(),
        language: faker.helpers.arrayElement(['en', 'es', 'fr']),
        currency: faker.helpers.arrayElement(['USD', 'EUR', 'GBP']),
        timezone: faker.helpers.arrayElement(['UTC', 'GMT', 'PST']),
        country: faker.location.country(),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zip: faker.location.zipCode(),
        },
        notificationPreferences: {
          email: faker.datatype.boolean(),
          push: faker.datatype.boolean(),
          sms: faker.datatype.boolean(),
        },
        privacySettings: {
          profileVisibility: faker.helpers.arrayElement(['public', 'private']),
          showEmail: faker.datatype.boolean(),
          showPhone: faker.datatype.boolean(),
        },
        dataConsent: faker.datatype.boolean(),
        socialLinks: {
          facebook: faker.internet.url(),
          twitter: faker.internet.url(),
        },
        referralCode: crypto.randomUUID(),
        referredBy: null,
        lastLogin: faker.date.recent(),
        lastActivity: faker.date.recent(),
        status: faker.helpers.arrayElement(['active', 'inactive']),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    const createdUsers = await db.sequelize.models.User.bulkCreate(users);
    console.log(`✅ Created ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
}

// Seed User Roles
async function seedUserRoles(sequelize, users, roles) {
  try {
    if (!users?.length || !roles?.length) {
      console.log('No users or roles found. Skipping user roles seeding.');
      return [];
    }
    
    const userRoles = users.map(user => {
      // Assign a random role to each user
      const role = roles[faker.number.int({ min: 0, max: roles.length - 1 })];
      
      return {
        userId: user.id,
        roleId: role.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    const createdUserRoles = await db.sequelize.models.UserRoles.bulkCreate(userRoles);
    console.log(`✅ Created ${createdUserRoles.length} user roles`);
    return createdUserRoles;
  } catch (error) {
    console.error('Error seeding user roles:', error);
    throw error;
  }
}

// Seed Property Types
async function seedPropertyTypes(sequelize) {
    try {
      const usedSlugs = new Set();
      
      const uniqueSlug = (name) => {
        let slug;
        do {
          slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        } while (usedSlugs.has(slug));
        usedSlugs.add(slug);
        return slug;
      };
  
      const propertyTypes = ['Apartment', 'House', 'Villa', 'Studio', 'Condo'].map(name => ({
        name,
        description: faker.lorem.sentence(),
        icon: `${name.toLowerCase()}-icon`,
        isActive: faker.datatype.boolean(0.9),
        slug: uniqueSlug(name),
        createdAt: new Date(),
        updatedAt: new Date()
      }));
  
      const createdPropertyTypes = await db.sequelize.models.PropertyType.bulkCreate(propertyTypes);
      console.log(`✅ Created ${createdPropertyTypes.length} property types`);
      return createdPropertyTypes;
    } catch (error) {
      console.error('Error seeding property types:', error);
      throw error;
    }
  }
// Seed Room Types
async function seedRoomTypes(sequelize, count = 10) {
  try {
    const roomTypes = Array.from({ length: count }).map(() => {
      const name = faker.lorem.words(2).split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      return {
        name,
        description: faker.lorem.paragraph(),
        icon: faker.image.url({ width: 64, height: 64 }),
        isActive: faker.datatype.boolean(0.9),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    const createdRoomTypes = await db.sequelize.models.RoomType.bulkCreate(roomTypes);
    console.log(`✅ Created ${createdRoomTypes.length} room types`);
    return createdRoomTypes;
  } catch (error) {
    console.error('Error seeding room types:', error);
    throw error;
  }
}

// Seed Categories
async function seedCategories(sequelize, count = 10) {
    try {
      const usedNames = new Set();
      const uniqueName = (fn) => {
        let name;
        do { name = fn(); } while (usedNames.has(name));
        usedNames.add(name);
        return name;
      };
  
      const parentCategories = Array.from({ length: Math.ceil(count / 2) }, () => ({
        name: uniqueName(() => faker.commerce.department()),
        description: faker.lorem.paragraph(),
        icon: faker.image.url({ width: 64, height: 64 }),
        isActive: faker.datatype.boolean(0.9),
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
  
      const parents = await db.sequelize.models.Category.bulkCreate(parentCategories);
  
      const childCategories = Array.from({ length: Math.floor(count / 2) }, () => ({
        name: uniqueName(() => faker.commerce.productName().split(' ').slice(0, 2).join(' ')),
        description: faker.lorem.paragraph(),
        icon: faker.image.url({ width: 64, height: 64 }),
        isActive: faker.datatype.boolean(0.9),
        parentId: parents[faker.number.int({ min: 0, max: parents.length - 1 })].id,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
  
      const allCategories = await db.sequelize.models.Category.bulkCreate(childCategories);
  
      console.log(`✅ Created ${parents.length + allCategories.length} categories`);
      return [...parents, ...allCategories];
    } catch (error) {
      console.error('Error seeding categories:', error);
      throw error;
    }
  }

// Seed Locations
async function seedLocations(sequelize, count = 10) {
  try {
    // Generate parent locations (half of total count)
    const parentLocations = Array.from({ length: Math.ceil(count / 2) }).map(() => ({
      name: faker.location.city(),
      description: faker.lorem.paragraph(),
      icon: faker.image.url({ width: 64, height: 64 }),
      isActive: faker.datatype.boolean(0.9),
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const createdParentLocations = await db.sequelize.models.Location.bulkCreate(parentLocations);
    
    // Generate child locations
    const childLocations = Array.from({ length: Math.floor(count / 2) }).map(() => {
      const name = faker.location.street();
      const parentId = createdParentLocations[faker.number.int({ min: 0, max: createdParentLocations.length - 1 })].id;
      
      return {
        name,
        description: faker.lorem.paragraph(),
        icon: faker.image.url({ width: 64, height: 64 }),
        isActive: faker.datatype.boolean(0.9),
        parentId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    const createdChildLocations = await db.sequelize.models.Location.bulkCreate(childLocations);
    const allLocations = [...createdParentLocations, ...createdChildLocations];
    
    console.log(`✅ Created ${allLocations.length} locations`);
    return allLocations;
  } catch (error) {
    console.error('Error seeding locations:', error);
    throw error;
  }
}

// Seed Host Profiles
async function seedHostProfiles(sequelize, users, count = 10) {
  try {
    const hostUsers = users.filter((_, index) => index % 3 === 1); // Every third user is a host
    const languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'];
    const verificationStatuses = ['unverified', 'pending', 'verified', 'rejected'];
    
    const hostProfiles = hostUsers.map(user => ({
      userId: user.id,
      displayName: faker.person.fullName(),
      bio: faker.lorem.paragraph(),
      profilePicture: faker.image.avatar(),
      phoneNumber: faker.phone.number('+############'),
      preferredLanguage: faker.helpers.arrayElement(languages),
      responseTime: faker.number.int({ min: 0, max: 1440 }),
      responseRate: faker.number.float({ min: 0, max: 100, precision: 0.01 }),
      isSuperhost: faker.datatype.boolean(0.2),
      superhostSince: faker.datatype.boolean(0.2) ? faker.date.past() : null,
      verificationStatus: faker.helpers.arrayElement(verificationStatuses),
      verificationDocuments: {
        idType: faker.helpers.arrayElement(['passport', 'driver_license', 'id_card']),
        documentNumber: faker.string.alphanumeric(10),
        expiryDate: faker.date.future()
      },
      notificationPreferences: {
        email: faker.datatype.boolean(),
        sms: faker.datatype.boolean(),
        push: faker.datatype.boolean(),
        bookingRequests: faker.datatype.boolean(),
        messages: faker.datatype.boolean(),
        reviews: faker.datatype.boolean(),
        updates: faker.datatype.boolean()
      },
      isActive: faker.datatype.boolean(0.9),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const createdHostProfiles = await db.sequelize.models.HostProfile.bulkCreate(hostProfiles);
    console.log(`✅ Created ${createdHostProfiles.length} host profiles`);
    return createdHostProfiles;
  } catch (error) {
    console.error('Error seeding host profiles:', error);
    throw error;
  }
}

// Seed Guest Profiles
async function seedGuestProfiles(sequelize, users, count = 10) {
  try {
    const guestUsers = users.filter((_, index) => index % 3 === 0); // Every third user is a guest
    const languages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'];
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'];
    const verificationStatuses = ['pending', 'verified', 'rejected'];
    
    const guestProfiles = guestUsers.map(user => {
      const isVerified = faker.datatype.boolean(0.3);
      
      return {
        userId: user.id,
        displayName: faker.person.fullName(),
        phoneNumber: faker.phone.number('+##########'),
        dateOfBirth: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
        preferredLanguage: faker.helpers.arrayElement(languages),
        preferredCurrency: faker.helpers.arrayElement(currencies),
        isVerified,
        verificationStatus: isVerified ? 'verified' : faker.helpers.arrayElement(verificationStatuses),
        verificationDocuments: {
          idType: faker.helpers.arrayElement(['passport', 'driver_license', 'id_card']),
          documentNumber: faker.string.alphanumeric(10),
          issuedDate: faker.date.past(),
          expiryDate: faker.date.future()
        },
        preferences: {
          notifications: {
            email: faker.datatype.boolean(),
            sms: faker.datatype.boolean(),
            push: faker.datatype.boolean()
          },
          privacy: {
            showProfile: faker.datatype.boolean(),
            showReviews: faker.datatype.boolean()
          }
        },
        metadata: {
          lastLogin: faker.date.recent(),
          registrationSource: faker.helpers.arrayElement(['web', 'mobile', 'partner'])
        },
        isActive: faker.datatype.boolean(0.9),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    const createdGuestProfiles = await db.sequelize.models.GuestProfile.bulkCreate(guestProfiles);
    console.log(`✅ Created ${createdGuestProfiles.length} guest profiles`);
    return createdGuestProfiles;
  } catch (error) {
    console.error('Error seeding guest profiles:', error);
    throw error;
  }
}

// Seed Listings
async function seedListings(sequelize, hostProfiles, propertyTypes, roomTypes, categories, locations, count = 10) {
  try {
    const cancellationPolicies = ['flexible', 'moderate', 'strict'];
    const statuses = ['draft', 'published', 'archived'];
    
    const listings = Array.from({ length: count }).map((_, index) => {
      const hostProfile = hostProfiles[index % hostProfiles.length];
      const propertyType = propertyTypes[index % propertyTypes.length];
      const roomType = roomTypes[index % roomTypes.length];
      const category = categories[index % categories.length];
      const location = locations[index % locations.length];
      const pricePerNight = faker.number.float({ min: 20, max: 1000, precision: 0.01 });
      
      return {
        title: faker.lorem.words({ min: 3, max: 8 }),
        description: faker.lorem.paragraphs({ min: 2, max: 5 }),
        hostId: hostProfile.id,
        propertyTypeId: propertyType.id,
        roomTypeId: roomType.id,
        categoryId: category.id,
        locationId: location.id,
        accommodates: faker.number.int({ min: 1, max: 16 }),
        bedrooms: faker.number.int({ min: 0, max: 10 }),
        beds: faker.number.int({ min: 1, max: 12 }),
        bathrooms: faker.number.float({ min: 0.5, max: 8, precision: 0.5 }),
        pricePerNight,
        cleaningFee: faker.number.float({ min: 0, max: 200, precision: 0.01 }),
        securityDeposit: faker.number.float({ min: 0, max: 1000, precision: 0.01 }),
        minimumNights: faker.number.int({ min: 1, max: 30 }),
        maximumNights: faker.number.int({ min: 31, max: 365 }),
        cancellationPolicy: faker.helpers.arrayElement(cancellationPolicies),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          country: faker.location.country(),
          zipCode: faker.location.zipCode()
        },
        coordinates: {
          lat: faker.location.latitude(),
          lng: faker.location.longitude()
        },
        isActive: faker.datatype.boolean(0.9),
        instantBookable: faker.datatype.boolean(0.3),
        status: faker.helpers.arrayElement(statuses),
        views: faker.number.int({ min: 0, max: 1000 }),
        averageRating: faker.number.float({ min: 0, max: 5, precision: 0.1 }),
        reviewCount: faker.number.int({ min: 0, max: 100 }),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    const createdListings = await db.sequelize.models.Listing.bulkCreate(listings);
    console.log(`✅ Created ${createdListings.length} listings`);
    return createdListings;
  } catch (error) {
    console.error('Error seeding listings:', error);
    throw error;
  }
}

// Seed Amenities
async function seedAmenities(sequelize, count = 10) {
  try {
    // Generate parent amenities (half of total count)
    const parentAmenities = Array.from({ length: Math.ceil(count / 2) }).map(() => {
      const name = faker.lorem.words(2).split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      
      return {
        name,
        description: faker.lorem.sentence(),
        icon: faker.image.url({ width: 64, height: 64 }),
        isActive: faker.datatype.boolean(0.9),
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    const createdParentAmenities = await db.sequelize.models.Amenity.bulkCreate(parentAmenities);
    
    // Generate child amenities
    const childAmenities = Array.from({ length: Math.floor(count / 2) }).map(() => {
      const name = faker.lorem.words(2).split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      const parentId = createdParentAmenities[faker.number.int({ min: 0, max: createdParentAmenities.length - 1 })].id;
      
      return {
        name,
        description: faker.lorem.sentence(),
        icon: faker.image.url({ width: 64, height: 64 }),
        isActive: faker.datatype.boolean(0.9),
        parentId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    const createdChildAmenities = await db.sequelize.models.Amenity.bulkCreate(childAmenities);
    const allAmenities = [...createdParentAmenities, ...createdChildAmenities];
    
    console.log(`✅ Created ${allAmenities.length} amenities`);
    return allAmenities;
  } catch (error) {
    console.error('Error seeding amenities:', error);
    throw error;
  }
}

// Seed Listing Amenities
async function seedListingAmenities(sequelize, listings, amenities, count = 20) {
  try {
    const usedCombinations = new Set();
    const listingAmenities = [];
    
    // Ensure each listing has at least some amenities
    listings.forEach(listing => {
      // Assign 3-8 random amenities to each listing
      const amenityCount = faker.number.int({ min: 3, max: 8 });
      
      for (let i = 0; i < amenityCount; i++) {
        const amenity = amenities[faker.number.int({ min: 0, max: amenities.length - 1 })];
        const combination = `${listing.id}-${amenity.id}`;
        
        if (!usedCombinations.has(combination)) {
          usedCombinations.add(combination);
          
          listingAmenities.push({
            listingId: listing.id,
            amenityId: amenity.id,
            isActive: faker.datatype.boolean(0.9),
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }
    });
    
    const createdListingAmenities = await db.sequelize.models.ListingAmenity.bulkCreate(listingAmenities);
    console.log(`✅ Created ${createdListingAmenities.length} listing amenities`);
    return createdListingAmenities;
  } catch (error) {
    console.error('Error seeding listing amenities:', error);
    throw error;
  }
}

// Seed Photos
async function seedPhotos(sequelize, listings, count = 20) {
  try {
    const categories = [
      'exterior', 'interior', 'bedroom', 'bathroom', 'kitchen',
      'living_room', 'dining_room', 'garden', 'pool', 'view', 'other'
    ];
    const fileTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const statuses = ['pending', 'approved', 'rejected'];
    
    const photos = [];
    
    // Ensure each listing has at least some photos
    listings.forEach(listing => {
      // Assign 3-8 photos to each listing
      const photoCount = faker.number.int({ min: 3, max: 8 });
      
      for (let i = 0; i < photoCount; i++) {
        const url = faker.image.url({ width: 1920, height: 1080 });
        
        photos.push({
          listingId: listing.id,
          url,
          thumbnailUrl: url.replace(/(\.[^.]+)$/, '_thumb$1'),
          fileType: faker.helpers.arrayElement(fileTypes),
          fileSize: faker.number.int({ min: 1000, max: 5 * 1024 * 1024 }),
          width: faker.number.int({ min: 800, max: 3840 }),
          height: faker.number.int({ min: 600, max: 2160 }),
          caption: faker.lorem.sentence({ min: 3, max: 10 }),
          category: faker.helpers.arrayElement(categories),
          tags: faker.lorem.words({ min: 0, max: 5 }).split(' '),
          takenAt: faker.date.past(),
          isCover: i === 0, // First photo is the cover
          displayOrder: i,
          status: faker.helpers.arrayElement(statuses),
          rejectionReason: faker.datatype.boolean(0.2) ? faker.lorem.sentence() : null,
          isActive: faker.datatype.boolean(0.9),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });
    
    const createdPhotos = await db.sequelize.models.Photo.bulkCreate(photos);
    console.log(`✅ Created ${createdPhotos.length} photos`);
    return createdPhotos;
  } catch (error) {
    console.error('Error seeding photos:', error);
    throw error;
  }
}

// Seed Property Rules
async function seedPropertyRules(sequelize, listings, count = 20) {
  try {
    const ruleTypes = [
      'check_in', 'check_out', 'quiet_hours', 'smoking', 'pets',
      'parties', 'children', 'visitors', 'parking', 'amenities',
      'safety', 'other'
    ];
    
    const propertyRules = [];
    
    // Ensure each listing has at least some rules
    listings.forEach(listing => {
      // Assign 2-5 rules to each listing
      const ruleCount = faker.number.int({ min: 2, max: 5 });
      
      for (let i = 0; i < ruleCount; i++) {
        const type = faker.helpers.arrayElement(ruleTypes);
        
        propertyRules.push({
          listingId: listing.id,
          type,
          title: `${type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Rule`,
          description: faker.lorem.sentence(),
          isAllowed: faker.datatype.boolean(),
          restrictions: {
            time: type.includes('hours') ? `${faker.number.int({ min: 8, max: 22 })}:00` : null,
            ageLimit: type === 'children' ? faker.number.int({ min: 0, max: 18 }) : null,
            quantity: type === 'pets' ? faker.number.int({ min: 0, max: 3 }) : null
          },
          penalty: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
          isActive: faker.datatype.boolean(0.9),
          displayOrder: i,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });
    
    const createdPropertyRules = await db.sequelize.models.PropertyRule.bulkCreate(propertyRules);
    console.log(`✅ Created ${createdPropertyRules.length} property rules`);
    return createdPropertyRules;
  } catch (error) {
    console.error('Error seeding property rules:', error);
    throw error;
  }
}

// Seed Property Policies
async function seedPropertyPolicies(sequelize, listings, count = 20) {
  try {
    const policyTypes = [
      'cancellation', 'refund', 'house_rules', 'check_in', 'check_out',
      'security_deposit', 'cleaning', 'damage', 'liability', 'insurance', 'other'
    ];
    
    const propertyPolicies = [];
    
    // Ensure each listing has at least some policies
    listings.forEach(listing => {
      // Assign 2-4 policies to each listing
      const policyCount = faker.number.int({ min: 2, max: 4 });
      
      for (let i = 0; i < policyCount; i++) {
        const type = faker.helpers.arrayElement(policyTypes);
        
        propertyPolicies.push({
          listingId: listing.id,
          type,
          title: `${type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Policy`,
          description: faker.lorem.paragraph(),
          terms: {
            deadline: type === 'cancellation' ? `${faker.number.int({ min: 24, max: 168 })} hours` : null,
            percentage: type === 'refund' ? faker.number.int({ min: 0, max: 100 }) : null,
            requirements: faker.lorem.sentence()
          },
          conditions: {
            appliesTo: faker.helpers.arrayElement(['all guests', 'specific bookings', 'peak season']),
            minStay: type === 'check_in' || type === 'check_out' ? faker.number.int({ min: 1, max: 30 }) : null
          },
          exceptions: {
            forceMajeure: faker.datatype.boolean(),
            specialCases: faker.lorem.words({ min: 2, max: 5 })
          },
          lastUpdated: faker.date.recent(),
          version: `${faker.number.int({ min: 1, max: 3 })}.${faker.number.int({ min: 0, max: 9 })}`,
          isActive: faker.datatype.boolean(0.9),
          requiresAgreement: faker.datatype.boolean(0.8),
          displayOrder: i,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });
    
    const createdPropertyPolicies = await db.sequelize.models.PropertyPolicy.bulkCreate(propertyPolicies);
    console.log(`✅ Created ${createdPropertyPolicies.length} property policies`);
    return createdPropertyPolicies;
  } catch (error) {
    console.error('Error seeding property policies:', error);
    throw error;
  }
}

// Seed Property Availability
async function seedPropertyAvailability(sequelize, listings, count = 20) {
  try {
    const propertyAvailabilities = [];
    
    // Create availability for the next 30 days for each listing
    listings.forEach(listing => {
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const price = faker.number.float({ min: 20, max: 1000, precision: 0.01 });
        
        propertyAvailabilities.push({
          listingId: listing.id,
          date: date.toISOString().split('T')[0],
          isAvailable: faker.datatype.boolean(0.8),
          price,
          minimumNights: faker.number.int({ min: 1, max: 30 }),
          maximumNights: faker.number.int({ min: 31, max: 365 }),
          checkInTime: `${faker.number.int({ min: 8, max: 14 })}:00`,
          checkOutTime: `${faker.number.int({ min: 15, max: 23 })}:00`,
          notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : null,
          isActive: faker.datatype.boolean(0.9),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });
    
    const createdPropertyAvailabilities = await db.sequelize.models.PropertyAvailability.bulkCreate(propertyAvailabilities);
    console.log(`✅ Created ${createdPropertyAvailabilities.length} property availabilities`);
    return createdPropertyAvailabilities;
  } catch (error) {
    console.error('Error seeding property availabilities:', error);
    throw error;
  }
}

// Seed Price Rules
async function seedPriceRules(sequelize, listings, count = 10) {
  try {
    const priceRules = [];
    
    listings.forEach(listing => {
      // Create 1-3 price rules per listing
      const ruleCount = faker.number.int({ min: 1, max: 3 });
      
      for (let i = 0; i < ruleCount; i++) {
        priceRules.push({
          listingId: listing.id,
          name: faker.lorem.words(3),
          type: faker.helpers.arrayElement([
            'last_minute',
            'early_bird',
            'length_of_stay',
            'weekend',
            'holiday',
            'special_event',
            'demand',
            'custom'
          ]),
          startDate: faker.date.soon(30).toISOString().split('T')[0],
          endDate: faker.date.soon(60).toISOString().split('T')[0],
          condition: {
            days: faker.number.int({ min: 1, max: 30 }),
            minDays: faker.number.int({ min: 1, max: 10 }),
            maxDays: faker.number.int({ min: 10, max: 30 })
          },
          adjustmentType: faker.helpers.arrayElement(['percentage', 'fixed', 'multiplier']),
          adjustmentValue: faker.number.int({ min: -50, max: 100 }),
          minStay: faker.number.int({ min: 1, max: 7 }),
          maxStay: faker.number.int({ min: 7, max: 30 }),
          priority: faker.number.int({ min: 0, max: 5 }),
          isActive: faker.datatype.boolean(),
          notes: faker.lorem.sentence(),
          metadata: {
            createdBy: faker.internet.userName(),
            lastUpdatedBy: faker.internet.userName()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });
    
    const createdPriceRules = await db.sequelize.models.PriceRule.bulkCreate(priceRules);
    console.log(`✅ Created ${createdPriceRules.length} price rules`);
    return createdPriceRules;
  } catch (error) {
    console.error('Error seeding price rules:', error);
    throw error;
  }
}

// Seed Seasonal Pricing
async function seedSeasonalPricing(sequelize, listings, count = 10) {
  try {
    const seasonalPricings = [];
    
    listings.forEach(listing => {
      // Create 1-2 seasonal pricing rules per listing
      const seasonCount = faker.number.int({ min: 1, max: 2 });
      
      for (let i = 0; i < seasonCount; i++) {
        seasonalPricings.push({
          listingId: listing.id,
          name: faker.lorem.words(3),
          startDate: faker.date.soon(30).toISOString().split('T')[0],
          endDate: faker.date.soon(60).toISOString().split('T')[0],
          adjustmentType: faker.helpers.arrayElement(['percentage', 'fixed', 'multiplier']),
          adjustmentValue: faker.number.int({ min: -50, max: 100 }),
          minStay: faker.number.int({ min: 1, max: 7 }),
          maxStay: faker.number.int({ min: 7, max: 30 }),
          priority: faker.number.int({ min: 0, max: 5 }),
          isActive: faker.datatype.boolean(),
          notes: faker.lorem.sentence(),
          metadata: {
            createdBy: faker.internet.userName(),
            lastUpdatedBy: faker.internet.userName()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });
    
    const createdSeasonalPricings = await db.sequelize.models.SeasonalPricing.bulkCreate(seasonalPricings);
    console.log(`✅ Created ${createdSeasonalPricings.length} seasonal pricings`);
    return createdSeasonalPricings;
  } catch (error) {
    console.error('Error seeding seasonal pricings:', error);
    throw error;
  }
}

// Seed Bookings
async function seedBookings(sequelize, listings, guestProfiles, hostProfiles, count = 20) {
  try {
    const bookings = [];
    
    for (let i = 0; i < count; i++) {
      const listing = listings[faker.number.int({ min: 0, max: listings.length - 1 })];
      const guestProfile = guestProfiles[faker.number.int({ min: 0, max: guestProfiles.length - 1 })];
      const hostProfile = hostProfiles.find(host => host.id === listing.hostId) || 
                          hostProfiles[faker.number.int({ min: 0, max: hostProfiles.length - 1 })];
      
      const checkIn = faker.date.soon(10);
      const duration = faker.number.int({ min: 1, max: 14 });
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + duration);
      
      bookings.push({
        listingId: listing.id,
        guestId: guestProfile.id,
        hostId: hostProfile.id,
        checkIn: checkIn.toISOString().split('T')[0],
        checkOut: checkOut.toISOString().split('T')[0],
        numberOfGuests: faker.number.int({ min: 1, max: 10 }),
        totalPrice: faker.number.float({ min: 100, max: 1000, precision: 0.01 }),
        status: faker.helpers.arrayElement([
          'pending',
          'confirmed',
          'cancelled',
          'completed',
        ]),
        paymentStatus: faker.helpers.arrayElement([
          'pending',
          'paid',
          'refunded',
          'failed',
        ]),
        specialRequests: faker.lorem.sentence(),
        cancellationReason: faker.lorem.sentence(),
        isActive: faker.datatype.boolean(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    const createdBookings = await db.sequelize.models.Booking.bulkCreate(bookings);
    console.log(`✅ Created ${createdBookings.length} bookings`);
    return createdBookings;
  } catch (error) {
    console.error('Error seeding bookings:', error);
    throw error;
  }
}

// Seed Booking Calendars
async function seedBookingCalendars(sequelize, listings, count = 30) {
  try {
    const bookingCalendars = [];
    
    listings.forEach(listing => {
      // Create calendar entries for the next 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        bookingCalendars.push({
          listingId: listing.id,
          date: date.toISOString().split('T')[0],
          isAvailable: faker.datatype.boolean(),
          basePrice: faker.number.float({ min: 50, max: 500, precision: 0.01 }),
          minStay: faker.number.int({ min: 1, max: 5 }),
          maxStay: faker.number.int({ min: 5, max: 14 }),
          checkInAllowed: faker.datatype.boolean(),
          checkOutAllowed: faker.datatype.boolean(),
          notes: faker.lorem.sentence(),
          metadata: {
            cleaningFee: faker.number.float({ min: 10, max: 50, precision: 0.01 }),
            taxes: faker.number.float({ min: 5, max: 20, precision: 0.01 }),
          },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });
    
    const createdBookingCalendars = await db.sequelize.models.BookingCalendar.bulkCreate(bookingCalendars);
    console.log(`✅ Created ${createdBookingCalendars.length} booking calendar entries`);
    return createdBookingCalendars;
  } catch (error) {
    console.error('Error seeding booking calendars:', error);
    throw error;
  }
}

// Seed Reviews
async function seedReviews(sequelize, bookings, users, count = 30) {
  try {
    const reviews = [];
    
    // Create reviews for completed bookings
    const completedBookings = bookings.filter(booking => booking.status === 'completed');
    
    completedBookings.forEach(booking => {
      // Guest review
      reviews.push({
        bookingId: booking.id,
        reviewerId: booking.guestId,
        reviewedId: booking.hostId,
        rating: faker.number.int({ min: 1, max: 5 }),
        comment: faker.lorem.paragraph(),
        type: 'host',
        isPublic: faker.datatype.boolean(),
        response: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        responseDate: faker.datatype.boolean() ? faker.date.past() : null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Host review
      reviews.push({
        bookingId: booking.id,
        reviewerId: booking.hostId,
        reviewedId: booking.guestId,
        rating: faker.number.int({ min: 1, max: 5 }),
        comment: faker.lorem.paragraph(),
        type: 'guest',
        isPublic: faker.datatype.boolean(),
        response: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        responseDate: faker.datatype.boolean() ? faker.date.past() : null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    const createdReviews = await db.sequelize.models.Review.bulkCreate(reviews);
    console.log(`✅ Created ${createdReviews.length} reviews`);
    return createdReviews;
  } catch (error) {
    console.error('Error seeding reviews:', error);
    throw error;
  }
}

// Seed Reports
async function seedReports(sequelize, users, listings, count = 50) {
  try {
    const reports = Array.from({ length: count }).map(() => {
      const type = faker.helpers.arrayElement(['user', 'listing']);
      const reporterId = users[faker.number.int({ min: 0, max: users.length - 1 })].id;
      const reportedUserId = type === 'user' ? users[faker.number.int({ min: 0, max: users.length - 1 })].id : null;
      const listingId = type === 'listing' ? listings[faker.number.int({ min: 0, max: listings.length - 1 })].id : null;
      const resolvedById = faker.datatype.boolean() ? users[faker.number.int({ min: 0, max: users.length - 1 })].id : null;
      
      return {
        type,
        reason: faker.helpers.arrayElement([
          'inappropriate_content',
          'fake_listing',
          'scam',
          'harassment',
          'spam',
          'other'
        ]),
        description: faker.lorem.sentences(3),
        status: faker.helpers.arrayElement(['pending', 'under_review', 'resolved', 'dismissed']),
        resolution: faker.datatype.boolean() ? faker.lorem.sentences(2) : null,
        reporterId,
        reportedUserId,
        listingId,
        resolvedById,
        resolvedAt: resolvedById ? faker.date.past() : null,
        createdAt: faker.date.past(),
        updatedAt: new Date()
      };
    });
    
    const createdReports = await db.sequelize.models.Report.bulkCreate(reports);
    console.log(`✅ Created ${createdReports.length} reports`);
    return createdReports;
  } catch (error) {
    console.error('Error seeding reports:', error);
    throw error;
  }
}

// Execute the seed function if this file is run directly
if (require.main === module) {
  seed().then(() => {
    console.log('Seeding completed successfully!');
    process.exit(0);
  }).catch(error => {
    console.error('Error during seeding:', error);
    process.exit(1);
  });
}

module.exports = {seed}