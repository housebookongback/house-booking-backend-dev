const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const PropertyAvailability = sequelize.define('PropertyAvailability', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        listingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Listings', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        isAvailable: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            }
        },
        minimumNights: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1
            }
        },
        maximumNights: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                min: 1
            }
        },
        checkInTime: {
            type: DataTypes.TIME,
            allowNull: true
        },
        checkOutTime: {
            type: DataTypes.TIME,
            allowNull: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'PropertyAvailabilities',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true },
            order: [['date', 'ASC']]
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            byListing: (listingId) => ({ where: { listingId } }),
            available: { where: { isAvailable: true } },
            unavailable: { where: { isAvailable: false } },
            byDateRange: (startDate, endDate) => ({
                where: {
                    date: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            }),
            byPriceRange: (minPrice, maxPrice) => ({
                where: {
                    price: {
                        [Op.between]: [minPrice, maxPrice]
                    }
                }
            })
        },
        indexes: [
            { fields: ['listingId'] },
            { fields: ['date'] },
            { fields: ['isAvailable'] },
            { fields: ['price'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] },
            {
                unique: true,
                fields: ['listingId', 'date'],
                name: 'listing_date_unique_idx'
            }
        ],
        validate: {
            async validListing() {
                const listing = await sequelize.models.Listing.findByPk(this.listingId);
                if (!listing) throw new Error('Invalid listing');
            },
            validDate() {
                if (this.date < new Date().toISOString().split('T')[0]) {
                    throw new Error('Date cannot be in the past');
                }
            },
            validNights() {
                if (this.maximumNights && this.maximumNights < this.minimumNights) {
                    throw new Error('Maximum nights cannot be less than minimum nights');
                }
            },
            validCheckTimes() {
                if (this.checkInTime && this.checkOutTime && this.checkInTime >= this.checkOutTime) {
                    throw new Error('Check-in time must be before check-out time');
                }
            }
        }
    });

    // Class Methods
    PropertyAvailability.findByListing = function(listingId) {
        return this.scope('byListing', listingId).findAll();
    };

    PropertyAvailability.findByDateRange = function(listingId, startDate, endDate) {
        return this.scope('byListing', listingId)
            .scope('byDateRange', startDate, endDate)
            .findAll();
    };

    PropertyAvailability.findAvailableDates = function(listingId, startDate, endDate) {
        return this.scope('byListing', listingId)
            .scope('byDateRange', startDate, endDate)
            .scope('available')
            .findAll();
    };

    PropertyAvailability.findByPriceRange = function(listingId, minPrice, maxPrice) {
        return this.scope('byListing', listingId)
            .scope('byPriceRange', minPrice, maxPrice)
            .findAll();
    };

    // Instance Methods
    PropertyAvailability.prototype.updateAvailability = async function(isAvailable) {
        return this.update({ isAvailable });
    };

    PropertyAvailability.prototype.updatePrice = async function(newPrice) {
        return this.update({ price: newPrice });
    };

    PropertyAvailability.prototype.updateNights = async function(minNights, maxNights) {
        return this.update({ 
            minimumNights: minNights,
            maximumNights: maxNights
        });
    };

    PropertyAvailability.prototype.updateCheckTimes = async function(checkInTime, checkOutTime) {
        return this.update({ 
            checkInTime,
            checkOutTime
        });
    };

    PropertyAvailability.prototype.getAvailabilityDetails = function() {
        return {
            id: this.id,
            date: this.date,
            isAvailable: this.isAvailable,
            price: this.price,
            minimumNights: this.minimumNights,
            maximumNights: this.maximumNights,
            checkInTime: this.checkInTime,
            checkOutTime: this.checkOutTime,
            notes: this.notes
        };
    };

    // Associations
    PropertyAvailability.associate = (models) => {
        PropertyAvailability.belongsTo(models.Listing, {
            foreignKey: 'listingId',
            as: 'listing'
        });
    };

    return PropertyAvailability;
}; 