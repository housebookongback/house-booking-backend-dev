// src/models/listing.js
/**
 * ✅ Final Step Reminder: Publishing a Listing
 * ------------------------------------------------
 * 
 * 🔹 Once all steps are completed (basicInfo → calendar)
 *    - Ensure stepStatus flags are all true
 * 🔹 Call: POST /api/listings/:listingId/publish
 *    - This will trigger Sequelize validations
 *    - Ensures all required fields, at least one photo, one rule, etc.
 * 🔹 Do NOT manually set status = 'published' on frontend!
 *    - Let backend handle it securely
 */

const { Op, literal } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Listings = sequelize.define('Listings', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [5, 100]
        }
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [10, 5000]
        }
      },
      // ─── Foreign keys ─────────────────────────
      hostId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      propertyTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'PropertyTypes', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      roomTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'RoomTypes', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Categories', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      locationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Locations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        validate: {
          async isValidIfPublished(value) {
            if (this.status === 'published' && !value) {
              throw new Error('Location is required for published listings');
            }
            // For draft listings, locationId can be null
          }
        }
      },
      // ─── Accommodation details ────────────────
      accommodates: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          isRequiredIfPublished(value) {
            if (this.status === 'published' && (value == null || value < 1)) {
              throw new Error('Accommodates is required for published listings');
            }
          }
        }
      },
      bedrooms: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          isRequiredIfPublished(value) {
            if (this.status === 'published' && value == null) {
              throw new Error('Bedrooms are required for published listings');
            }
          }
        }
      },
      beds: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          isRequiredIfPublished(value) {
            if (this.status === 'published' && (value == null )) {
              throw new Error('Beds are required for published listings');
            }
          }
        }
      },
      bathrooms: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
          min: 0,
          isRequiredIfPublished(value) {
            if (this.status === 'published' && value == null) {
              throw new Error('Bathrooms are required for published listings');
            }
          }
        }
      },
      // ─── Pricing ───────────────────────────────
      pricePerNight: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: true,
        validate: {
          min: 0,
          isRequiredIfPublished(value) {
            if (this.status === 'published' && (value == null || value < 0)) {
              throw new Error('Price per night is required for published listings');
            }
          }
        }
      },
      cleaningFee: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: true,
        validate: { min: 0 }
      },
      securityDeposit: {
        type: DataTypes.DECIMAL(10,2),
        allowNull: true,
        validate: { min: 0 }
      },
      minimumNights: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          isRequiredIfPublished(value) {
            if (this.status === 'published' && (!value || value < 1)) {
              throw new Error('Minimum nights is required for published listings');
            }
          }
        }
      },
      maximumNights: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
          isRequiredIfPublished(value) {
            if (this.status === 'published' && value == null) {
              throw new Error('Maximum nights is required for published listings');
            }
          }
        }
      },
      cancellationPolicy: {
        type: DataTypes.ENUM('flexible','moderate','strict'),
        allowNull: true,
        defaultValue: 'moderate',
        validate: {
          isRequiredIfPublished(value) {
            if (this.status === 'published' && !value) {
              throw new Error('Cancellation policy is required for published listings');
            }
          }
        }
      },
      // ─── Location & address ───────────────────
      address: {
        type: DataTypes.JSON,
        allowNull: true,
        validate: {
          isValidAddress(value) {
            if (this.status === 'published') {
              if (!value || !value.street || !value.city || !value.country) {
                throw new Error('Address must include street, city, and country for published listings');
              }
            }
          }
        }
      },
      coordinates: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Stores latitude and longitude as {lat: number, lng: number}',
        validate: {
          isValidCoords(value) {
            if (this.status === 'published') {
              if (!value || typeof value.lat !== 'number' || typeof value.lng !== 'number') {
                throw new Error('Coordinates must include valid lat and lng for published listings');
              }
            }
          }
        }
      },
      // ─── Flags & status ───────────────────────
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      instantBookable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      status: {
        type: DataTypes.ENUM('draft','published','archived','deleted'),
        allowNull: false,
        defaultValue: 'draft'
      },
      views: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
      },
      averageRating: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: { min: 0, max: 5 }
      },
      reviewCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 }
      },
      stepStatus: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
            basicInfo: false,
            location: false,
            details: false,
            pricing: false,
            photos: false,
            rules: false,
            calendar: false
        }
      },
      defaultAvailability: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      checkInDays: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),    // Postgres only
        allowNull: false,
        defaultValue: [0,1,2,3,4,5,6]                // Sunday → Saturday
      },
      checkOutDays: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: false,
        defaultValue: [0,1,2,3,4,5,6]
      },
    }, {
      tableName: 'Listings', // Ensure the table name matches 'Listings'
      timestamps: true,
      paranoid: true,
      defaultScope: {
        where: { isActive: true, status: 'published' }
      },
      scopes: {
        all: { where: {} },
        active: { where: { isActive: true } },
        inactive: { where: { isActive: false } },
        draft: { where: { status: 'draft' } },
        published: { where: { status: 'published' } },
        archived: { where: { status: 'archived' } },
        instantBookable: { where: { instantBookable: true } },
        byHost: (hostId) => ({ where: { hostId } }),
        byLocation: (locationId) => ({ where: { locationId } }),
        byCategory: (categoryId) => ({ where: { categoryId } }),
        byPropertyType: (propertyTypeId) => ({ where: { propertyTypeId } }),
        byRoomType: (roomTypeId) => ({ where: { roomTypeId } }),
        withMinRating: (rating) => ({ where: { averageRating: { [Op.gte]: rating } } })
      },
      indexes: [
        { fields: ['hostId'] },
        { fields: ['categoryId'] },
        { fields: ['status'] },
        { fields: ['isActive'] },
        { fields: ['averageRating'] },
        { fields: ['pricePerNight'] },
        { fields: ['instantBookable'] }
      ],
      validate: {
        async validHost() {
          if (this.status === 'published') {
            const host = await sequelize.models.User.findByPk(this.hostId);
            if (!host) throw new Error('Invalid host');
          }
        },
        async validLocation() {
          if (this.status === 'published') {
            const location = await sequelize.models.Location.findByPk(this.locationId);
            if (!location) throw new Error('Invalid location');
          }
        },
        validMaxNights() {
          if (this.maximumNights && this.maximumNights < this.minimumNights) {
            throw new Error('Maximum nights must be greater than minimum nights');
          }
        },
        async hasPhotosIfPublished() {
            if (this.status === 'published') {
                const photos = await this.getPhotos();
                if (photos.length === 0) {
                    throw new Error('At least one photo is required for published listings');
                }
            }
        },
        async hasRulesIfPublished() {
            if (this.status === 'published') {
                // Skip validation if not changing status to 'published'
                if (!this.changed('status') || this.previous('status') === 'published') {
                    return;
                }
                
                const rules = await this.getPropertyRules();
                if (rules.length === 0) {
                    throw new Error('At least one property rule is required for published listings');
                }
            }
        }
      }
    });

      // Generate unique slug before validation
  Listings.prototype.generateSlug = async function() {
    const base = this.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    let slug = base, count = 1;
    while (await Listings.findOne({ where:{ slug }})) slug = `${base}-${count++}`;
    return slug;
  };
  Listings.addHook('beforeValidate', async listing => {
    if (!listing.slug && listing.title) listing.slug = await listing.generateSlug();
  });

 // After publish, seed calendar
  Listings.addHook('afterUpdate', async listing => {
    if (listing.changed('status') && listing.status === 'published') {
      const days=365, today=new Date(), batch=[];
      for(let i=0;i<days;i++){const date=new Date(today);date.setDate(date.getDate() + i);batch.push({
        listingId:listing.id,
        date,
        basePrice:parseFloat(listing.pricePerNight),
        isAvailable:listing.defaultAvailability,
        minStay:listing.minimumNights,
        maxStay:listing.maximumNights,
        checkInAllowed:listing.checkInDays.includes(date.getDay()),
        checkOutAllowed:listing.checkOutDays.includes(date.getDay())
      });}
      await sequelize.models.BookingCalendar.bulkCreate(batch,{ignoreDuplicates:true,validate:true});
    }
  });
    // Class Methods
    Listings.findByHost = function(hostId) {
      return this.scope('byHost', hostId).findAll();
    };
  
    Listings.findWithinRadius = function(lat, lng, radius) {
      return this.scope('withinRadius', lat, lng, radius).findAll();
    };
  
    Listings.getTopRated = function(limit = 10) {
      return this.scope('published')
        .findAll({
          order: [['averageRating', 'DESC']],
          limit
        });
    };
  
    // Instance Methods
    Listings.prototype.publish = function() {
      return this.update({ status: 'published' });
    };
  
    Listings.prototype.archive = function() {
      return this.update({ status: 'archived' });
    };
  
    Listings.prototype.incrementViews = function() {
      return this.increment('views');
    };
  
    Listings.prototype.updateRating = async function(newRating) {
      const oldRating = this.averageRating || 0;
      const oldCount = this.reviewCount;
      const newCount = oldCount + 1;
      const newAverage = ((oldRating * oldCount) + newRating) / newCount;
      
      return this.update({
        averageRating: newAverage,
        reviewCount: newCount
      });
    };
  
    // Associations
    Listings.associate = (models) => {
      // Host
      Listings.belongsTo(models.User, { foreignKey: 'hostId', as: 'host' });
  
      // Lookup tables
      Listings.belongsTo(models.PropertyType, { foreignKey: 'propertyTypeId', as: 'propertyType' });
      Listings.belongsTo(models.RoomType,     { foreignKey: 'roomTypeId',     as: 'roomType'     });
      Listings.belongsTo(models.Category,     { foreignKey: 'categoryId',     as: 'category'     });
      Listings.belongsTo(models.Location,     { foreignKey: 'locationId',     as: 'locationDetails' });
  
      // Photos
      Listings.hasMany(models.Photo, { foreignKey: 'listingId', as: 'photos' });
  
      // Amenities
      Listings.belongsToMany(models.Amenity, {
        through: models.ListingAmenities,
        as: 'amenities',
        foreignKey: 'listingId',
        otherKey: 'amenityId',
      });
  
      // Availability & pricing
      Listings.hasMany(models.PropertyAvailability, { foreignKey: 'listingId', as: 'availabilities' });
      Listings.hasMany(models.PriceRule,          { foreignKey: 'listingId', as: 'priceRules' });
      Listings.hasMany(models.SeasonalPricing,    { foreignKey: 'listingId', as: 'seasonalPricing' });
  
      // Transactions & feedback
      Listings.hasMany(models.Booking,           { foreignKey: 'listingId', as: 'bookings' });
      Listings.hasMany(models.BookingCalendar,   { foreignKey: 'listingId', as: 'calendar' });
      Listings.hasMany(models.Review,            { foreignKey: 'listingId', as: 'reviews' });
  
      // Policies & rules
      Listings.hasMany(models.PropertyRule,      { foreignKey: 'listingId', as: 'propertyRules' });
      Listings.hasMany(models.PropertyPolicy,    { foreignKey: 'listingId', as: 'propertyPolicies' });
  
      // Reports
      Listings.hasMany(models.Report,            { foreignKey: 'listingId', as: 'reports' });

      // Wishlist
      Listings.hasMany(models.Wishlist, { foreignKey: 'listingId', as: 'savedByUsers' });
      Listings.belongsToMany(models.User, {
        through: models.Wishlist,
        foreignKey: 'listingId',
        otherKey: 'userId',
        as: 'usersWhoWishlisted'
      });
    };
  
    return Listings;
  };
  