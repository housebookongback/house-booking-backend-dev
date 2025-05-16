const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Review = sequelize.define('Review', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        bookingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'Bookings', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        reviewerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        reviewedId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
            validate: {
                len: [0, 2000]
            }
        },
        type: {
            type: DataTypes.ENUM('guest', 'host'),
            allowNull: false
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        response: {
            type: DataTypes.TEXT,
            allowNull: true,
            validate: {
                len: [0, 2000]
            }
        },
        responseDate: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'Reviews',
        timestamps: true,
        paranoid: true,
        indexes: [
            { fields: ['bookingId'] },
            { fields: ['reviewerId'] },
            { fields: ['reviewedId'] },
            { fields: ['type'] },
            { fields: ['rating'] },
            { fields: ['isPublic'] },
            { fields: ['deletedAt'] }
        ],
        scopes: {
            all: { where: {} },
            public: { where: { isPublic: true } },
            byBooking: bookingId => ({ where: { bookingId } }),
            byReviewer: reviewerId => ({ where: { reviewerId } }),
            byReviewed: reviewedId => ({ where: { reviewedId } }),
            guestReviews: { where: { type: 'guest' } },
            hostReviews: { where: { type: 'host' } },
            withResponse: { where: { response: { [Op.ne]: null } } },
            withoutResponse: { where: { response: null } }
        },
        hooks: {
            beforeValidate: async review => {
                if (!review.type) {
                    const booking = await sequelize.models.Booking.findByPk(review.bookingId);
                    if (!booking) {
                        throw new Error('Invalid booking');
                    }
                    // If reviewer is the guest, they're reviewing the host
                    // If reviewer is the host, they're reviewing the guest
                    review.type = review.reviewerId === booking.guestId ? 'host' : 'guest';
                }
            },
            afterCreate: async review => {
                // Only update host's average rating for host reviews
                if (review.type === 'host') {
                    const stats = await Review.findAll({
                        where: { 
                            reviewedId: review.reviewedId, 
                            type: 'host',
                            deletedAt: null
                        },
                        attributes: [
                            [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
                            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                        ]
                    });
                    
                    const { avgRating, count } = stats[0].dataValues;
                    await sequelize.models.User.update(
                        { 
                            averageRating: avgRating || 0,
                            reviewCount: count || 0
                        },
                        { where: { id: review.reviewedId } }
                    );
                }
            },
            afterDestroy: async review => {
                try {
                    // Soft-delete all related reports
                    await sequelize.models.ReviewReport.destroy({
                        where: { reviewId: review.id }
                    });

                    // Also soft-delete any responses
                    await sequelize.models.ReviewResponse.destroy({
                        where: { reviewId: review.id }
                    });

                    // Update host's average rating if this was a host review
                    if (review.type === 'host') {
                        const stats = await Review.findAll({
                            where: { 
                                reviewedId: review.reviewedId, 
                                type: 'host',
                                deletedAt: null
                            },
                            attributes: [
                                [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
                                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
                            ]
                        });
                        
                        const { avgRating, count } = stats[0].dataValues;
                        await sequelize.models.User.update(
                            { 
                                averageRating: avgRating || 0,
                                reviewCount: count || 0
                            },
                            { where: { id: review.reviewedId } }
                        );
                    }
                } catch (error) {
                    console.error('Error in afterDestroy hook for Review:', error);
                    // Don't throw the error to prevent review deletion from failing
                }
            }
        }
    });

    // Class Methods
    Review.findByBooking = function(bookingId) {
        return this.scope('byBooking', bookingId).findAll();
    };

    Review.findByUser = function(userId) {
        return this.findAll({
            where: {
                [Op.or]: [
                    { reviewerId: userId },
                    { reviewedId: userId }
                ]
            }
        });
    };

    // Instance Methods
    Review.prototype.addResponse = async function(response) {
        this.response = response;
        this.responseDate = new Date();
        return this.save();
    };

    Review.prototype.toggleVisibility = async function() {
        this.isPublic = !this.isPublic;
        return this.save();
    };

    // Associations
    Review.associate = models => {
        Review.belongsTo(models.Booking, {
            foreignKey: 'bookingId',
            as: 'booking'
        });

        Review.belongsTo(models.User, {
            foreignKey: 'reviewerId',
            as: 'reviewer'
        });

        Review.belongsTo(models.User, {
            foreignKey: 'reviewedId',
            as: 'reviewed'
        });
    };

    return Review;
}; 