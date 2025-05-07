const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const GuestPreferences = sequelize.define('GuestPreferences', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        guestProfileId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'GuestProfiles', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        notifications: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
                email: {
                    bookingConfirmation: true,
                    bookingReminder: true,
                    reviewRequest: true,
                    specialOffers: true,
                    newsletter: false
                },
                sms: {
                    bookingConfirmation: true,
                    bookingReminder: true,
                    urgentAlerts: true
                },
                push: {
                    bookingUpdates: true,
                    messages: true,
                    deals: false
                }
            }
        },
        privacy: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
                showProfile: true,
                showReviews: true,
                showBookings: false,
                showWishlist: true,
                showSocialLinks: false
            }
        },
        searchPreferences: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
                priceRange: {
                    min: 0,
                    max: 1000
                },
                propertyTypes: [],
                amenities: [],
                locations: [],
                instantBook: false,
                superhostOnly: false
            }
        },
        stayPreferences: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
                checkInTime: '15:00',
                checkOutTime: '11:00',
                smoking: false,
                pets: false,
                accessibility: [],
                houseRules: []
            }
        },
        communicationPreferences: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
                language: 'en',
                timezone: 'UTC',
                responseTime: 'within_24_hours',
                autoTranslate: true
            }
        },
        paymentPreferences: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
                currency: 'USD',
                paymentMethods: [],
                autoPay: false,
                savePaymentInfo: false
            }
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'GuestPreferences',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            byGuestProfile: (id) => ({ where: { guestProfileId: id } })
        },
        indexes: [
            { unique: true, fields: ['guestProfileId'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] }
        ],
        validate: {
            async validGuestProfile() {
                const profile = await sequelize.models.GuestProfile.findByPk(this.guestProfileId);
                if (!profile) throw new Error('Invalid guest profile');
            },
            validPreferences() {
                const requiredSections = ['notifications', 'privacy', 'searchPreferences', 'stayPreferences', 'communicationPreferences', 'paymentPreferences'];
                requiredSections.forEach(section => {
                    if (!this[section] || typeof this[section] !== 'object') {
                        throw new Error(`Invalid ${section} preferences`);
                    }
                });
            }
        },
        hooks: {
            beforeValidate: (prefs) => {
                // Deep merge defaults with provided values
                const defaults = prefs.rawAttributes;
                if (!prefs.notifications) prefs.notifications = {};
                if (!prefs.privacy) prefs.privacy = {};
                if (!prefs.searchPreferences) prefs.searchPreferences = {};
                if (!prefs.stayPreferences) prefs.stayPreferences = {};
                if (!prefs.communicationPreferences) prefs.communicationPreferences = {};
                if (!prefs.paymentPreferences) prefs.paymentPreferences = {};

                prefs.notifications = {
                    ...defaults.notifications.defaultValue,
                    ...prefs.notifications
                };
                prefs.privacy = {
                    ...defaults.privacy.defaultValue,
                    ...prefs.privacy
                };
                prefs.searchPreferences = {
                    ...defaults.searchPreferences.defaultValue,
                    ...prefs.searchPreferences
                };
                prefs.stayPreferences = {
                    ...defaults.stayPreferences.defaultValue,
                    ...prefs.stayPreferences
                };
                prefs.communicationPreferences = {
                    ...defaults.communicationPreferences.defaultValue,
                    ...prefs.communicationPreferences
                };
                prefs.paymentPreferences = {
                    ...defaults.paymentPreferences.defaultValue,
                    ...prefs.paymentPreferences
                };
            }
        }
    });

    // Class Methods
    GuestPreferences.findByGuestProfile = function(guestProfileId) {
        return this.scope('byGuestProfile', guestProfileId).findOne();
    };

    // Instance Methods
    GuestPreferences.prototype.updateSection = async function(section, updates) {
        if (!this[section]) {
            throw new Error(`Invalid preference section: ${section}`);
        }
        this[section] = {
            ...this[section],
            ...updates
        };
        return this.save();
    };

    GuestPreferences.prototype.resetSection = async function(section) {
        if (!this[section]) {
            throw new Error(`Invalid preference section: ${section}`);
        }
        const def = this.rawAttributes[section].defaultValue;
        this[section] = JSON.parse(JSON.stringify(def));
        return this.save();
    };

    GuestPreferences.prototype.getPreferences = function() {
        return {
            notifications: this.notifications,
            privacy: this.privacy,
            searchPreferences: this.searchPreferences,
            stayPreferences: this.stayPreferences,
            communicationPreferences: this.communicationPreferences,
            paymentPreferences: this.paymentPreferences
        };
    };

    // Associations
    GuestPreferences.associate = models => {
        GuestPreferences.belongsTo(models.GuestProfile, {
            foreignKey: 'guestProfileId',
            as: 'guestProfile'
        });
    };

    return GuestPreferences;
}; 