const { Op, literal } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const BookingRequest = sequelize.define('BookingRequest', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        listingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { 
                model: 'Listings', 
                key: 'id' 
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        guestId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { 
                model: 'Users', 
                key: 'id' 
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        hostId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { 
                model: 'Users', 
                key: 'id' 
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        checkIn: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        checkOut: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        numberOfGuests: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: { min: 1 }
        },
        totalPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: { min: 0.01 }
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired'),
            allowNull: false,
            defaultValue: 'pending',
        },
        responseMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        responseDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: literal("CURRENT_TIMESTAMP + INTERVAL '24 hours'")
        },
        refundAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
    }, {
        tableName: 'BookingRequests',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: {
                status: 'pending',
                expiresAt: { [Op.gt]: literal('CURRENT_TIMESTAMP') }
            }
        },
        scopes: {
            all: { where: {} },
            pending: { where: { status: 'pending' } },
            approved: { where: { status: 'approved' } },
            rejected: { where: { status: 'rejected' } },
            expired: { where: { status: 'expired' } },
            active: {
                where: {
                    status: 'pending',
                    expiresAt: { [Op.gt]: literal('CURRENT_TIMESTAMP') }
                }
            },
            byGuest: guestId => ({ where: { guestId } }),
            byHost: hostId => ({ where: { hostId } }),
            withConflicts: {
                include: [{
                    model: sequelize.models.Booking,
                    as: 'conflictingBookings',
                    where: {
                        listingId: sequelize.col('BookingRequest.listingId'),
                        status: { [Op.ne]: 'cancelled' },
                        checkIn: { [Op.lt]: sequelize.col('BookingRequest.checkOut') },
                        checkOut: { [Op.gt]: sequelize.col('BookingRequest.checkIn') }
                    }
                }]
            }
        },
        indexes: [
            { fields: ['listingId'] },
            { fields: ['guestId'] },
            { fields: ['hostId'] },
            { fields: ['checkIn'] },
            { fields: ['checkOut'] },
            { fields: ['status'] },
            { fields: ['expiresAt'] },
            { fields: ['deletedAt'] },
            { 
                fields: ['listingId', 'checkIn', 'checkOut'],
                name: 'booking_request_dates_idx'
            },
            {
                fields: [sequelize.literal('tsrange("checkIn", "checkOut", \'[]\')')],
                using: 'GIST',
                name: 'booking_request_date_range_idx'
            }
        ],
        validate: {
            checkOutAfterCheckIn() {
                if (this.checkOut <= this.checkIn) {
                    throw new Error('Check-out date must be after check-in date');
                }
            },
            validGuestCount() {
                if (this.numberOfGuests < 1) {
                    throw new Error('Number of guests must be at least 1');
                }
            },
            validPrice() {
                if (this.totalPrice <= 0) {
                    throw new Error('Total price must be greater than zero');
                }
            },
            validExpiration() {
                if (this.expiresAt <= new Date()) {
                    throw new Error('Expiration date must be in the future');
                }
            },
            validResponse() {
                if (['approved', 'rejected'].includes(this.status) && !this.responseMessage) {
                    throw new Error('Response message is required when approving or rejecting a request');
                }
            },
            async validRefundAmount() {
                if (this.status === 'cancelled' && this.refundAmount) {
                    const booking = await this.getBooking();
                    if (!booking) {
                        throw new Error('Cannot validate refund amount without associated booking');
                    }
                    if (this.refundAmount > booking.totalPrice) {
                        throw new Error('Refund amount cannot exceed the original booking price');
                    }
                }
            }
        },
        hooks: {
            beforeValidate: async (req) => {
              if (!req.expiresAt) {
                req.expiresAt = await req.calculateExpiration();
              }
            },
            beforeCreate: async (request) => {
              if (!request.hostId) {
                const listing = await sequelize.models.Listing.findByPk(request.listingId);
                request.hostId = listing.hostId;
              }
          
              // Ensure expiration is set even if validation is bypassed
              if (!request.expiresAt) {
                request.expiresAt = await request.calculateExpiration();
              }
          
              // Check for date conflicts
              const conflicts = await request.checkDateConflicts();
              if (conflicts.length > 0) {
                throw new Error('Selected dates conflict with existing bookings');
              }
            },
            beforeUpdate: async (request) => {
              if (request.changed('status') && request.status !== 'pending') {
                request.responseDate = new Date();
              }
          
              // If dates are being changed, check for conflicts
              if (request.changed('checkIn') || request.changed('checkOut')) {
                const conflicts = await request.checkDateConflicts();
                if (conflicts.length > 0) {
                  throw new Error('Selected dates conflict with existing bookings');
                }
              }
            }
          }
          
    });

    // Class Methods
    BookingRequest.expireOldRequests = async function() {
        return this.update(
            { status: 'expired' },
            {
                where: {
                    status: 'pending',
                    expiresAt: { [Op.lt]: literal('CURRENT_TIMESTAMP') }
                }
            }
        );
    };

    // Instance Methods
    BookingRequest.prototype.checkDateConflicts = async function() {
        return sequelize.models.Booking.findAll({
            where: {
                listingId: this.listingId,
                status: { [Op.ne]: 'cancelled' },
                [Op.or]: [
                    {
                        checkIn: { [Op.between]: [this.checkIn, this.checkOut] }
                    },
                    {
                        checkOut: { [Op.between]: [this.checkIn, this.checkOut] }
                    },
                    {
                        [Op.and]: [
                            { checkIn: { [Op.lte]: this.checkIn } },
                            { checkOut: { [Op.gte]: this.checkOut } }
                        ]
                    }
                ]
            }
        });
    };

    BookingRequest.prototype.calculateExpiration = async function() {
        const listing = await this.getListing();
        const hours = listing?.bookingRequestExpiration > 0 
            ? listing.bookingRequestExpiration 
            : 24;
        return literal(`CURRENT_TIMESTAMP + INTERVAL '${hours} hours'`);
    };

    // Associations
    BookingRequest.associate = models => {
        // Request belongs to a Listing
        BookingRequest.belongsTo(models.Listing, {
            foreignKey: 'listingId',
            as: 'listing'
        });

        // Request belongs to a Guest
        BookingRequest.belongsTo(models.User, {
            foreignKey: 'guestId',
            as: 'guest'
        });

        // Request belongs to a Host
        BookingRequest.belongsTo(models.User, {
            foreignKey: 'hostId',
            as: 'host'
        });

        // Custom association for conflicting bookings
        BookingRequest.hasMany(models.Booking, {
            foreignKey: 'listingId',
            sourceKey: 'listingId',
            as: 'conflictingBookings',
            scope: {
                status: { [Op.notIn]: ['cancelled'] }
            }
        });
    };

    return BookingRequest;
}; 