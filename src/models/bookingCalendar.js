const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const BookingCalendar = sequelize.define('BookingCalendar', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        basePrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: { min: 0 }
        },
        minStay: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: { min: 1 }
        },
        maxStay: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: { min: 1 }
        },
        checkInAllowed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        checkOutAllowed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        }
    }, {
        tableName: 'BookingCalendars',
        timestamps: true,
        paranoid: true,
        indexes: [
            { unique: true, fields: ['listingId', 'date'] },
            { fields: ['date'] },
            { fields: ['isAvailable'] },
            { fields: ['deletedAt'] }
        ],
        validate: {
            async validListing() {
                if (!this.listingId) return; // Skip validation if no listingId
                
                try {
                    const listing = await sequelize.models.Listings.findByPk(this.listingId);
                    if (!listing) throw new Error('Invalid listing');
                } catch (error) {
                    // If this is part of a transaction, let the transaction handle the error
                    if (this._options && this._options.transaction) {
                        console.log(`Warning: Failed to validate listing ${this.listingId}`);
                    } else {
                        throw new Error('Invalid listing');
                    }
                }
            },
            validStayLimits() {
                if (this.maxStay && this.minStay > this.maxStay) {
                    throw new Error('Minimum stay cannot be greater than maximum stay');
                }
            }
        },
        scopes: {
            byDate: date => ({ where: { date } }),
            byListing: listingId => ({ where: { listingId } }),
            available: { where: { isAvailable: true } },
            unavailable: { where: { isAvailable: false } },
            byDateRange: (startDate, endDate) => ({
                where: {
                    date: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            }),
            withPriceRules: {
                include: [{
                    model: sequelize.models.PriceRule,
                    as: 'priceRules',
                    where: {
                        isActive: true,
                        startDate: { [Op.lte]: sequelize.col('BookingCalendar.date') },
                        endDate: { [Op.gte]: sequelize.col('BookingCalendar.date') }
                    },
                    order: [['priority', 'DESC']]
                }]
            }
        },
        hooks: {
            beforeCreate: async (calendar) => {
                // If no explicit availability set, check listing defaults
                if (calendar.isAvailable === null) {
                    const listing = await sequelize.models.Listing.findByPk(calendar.listingId);
                    calendar.isAvailable = listing?.defaultAvailability ?? true;
                }
            }
        }
    });

    // Class Methods
    BookingCalendar.findByListing = function(listingId) {
        return this.scope('byListing', listingId).findAll();
    };

    BookingCalendar.findByDateRange = function(listingId, startDate, endDate) {
        return this.scope('byListing', listingId, 'byDateRange', startDate, endDate).findAll();
    };

    BookingCalendar.checkAvailability = async function(listingId, startDate, endDate, guests) {
        // Get the listing to check its default availability and pricing
        const listing = await sequelize.models.Listing.findByPk(listingId);
        if (!listing) return false;

        // Get all calendar entries for the date range
        const dates = await this.scope('byListing', listingId, 'byDateRange', startDate, endDate).findAll();

        // Check each date in the range
        for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const calendarEntry = dates.find(d => d.date.toISOString().split('T')[0] === dateStr);

            // If no entry exists, use listing defaults
            if (!calendarEntry) {
                if (!listing.defaultAvailability) return false;
                if (guests < listing.minGuests || guests > listing.maxGuests) return false;
                continue;
            }

            // Check the calendar entry
            if (!calendarEntry.isAvailable) return false;
            if (calendarEntry.minStay && guests < calendarEntry.minStay) return false;
            if (calendarEntry.maxStay && guests > calendarEntry.maxStay) return false;
        }

        return true;
    };

    // Instance Methods
    BookingCalendar.prototype.updateAvailability = async function(isAvailable, notes) {
        this.isAvailable = isAvailable;
        if (notes) this.notes = notes;
        return this.save();
    };

    BookingCalendar.prototype.updatePricing = async function(basePrice, minStay, maxStay) {
        this.basePrice = basePrice;
        if (minStay) this.minStay = minStay;
        if (maxStay) this.maxStay = maxStay;
        return this.save();
    };

    BookingCalendar.prototype.getFinalPrice = async function() {
        // Get all applicable price rules
        const priceRules = await sequelize.models.PriceRule.findAll({
            where: {
                listingId: this.listingId,
                startDate: { [Op.lte]: this.date },
                endDate: { [Op.gte]: this.date },
                isActive: true
            },
            order: [['priority', 'DESC']]
        });

        // Apply price rules in order of priority
        let finalPrice = this.basePrice;
        for (const rule of priceRules) {
            finalPrice = await rule.applyToPrice(finalPrice);
        }

        return finalPrice;
    };

    // Associations
    BookingCalendar.associate = models => {
        BookingCalendar.belongsTo(models.Listing, {
            foreignKey: 'listingId',
            as: 'listing'
        });
        BookingCalendar.hasMany(models.PriceRule, {
            foreignKey: 'listingId',
            sourceKey: 'listingId',
            as: 'priceRules'
        });
    };

    return BookingCalendar;
};