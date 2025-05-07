const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const GuestProfile = sequelize.define('GuestProfile', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        displayName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                len: [2, 100]
            }
        },
        phoneNumber: {
            type: DataTypes.STRING(20),
            allowNull: true,
            validate: {
                is: /^\+?[1-9]\d{1,14}$/
            }
        },
        dateOfBirth: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        preferredLanguage: {
            type: DataTypes.STRING(5),
            allowNull: false,
            defaultValue: 'en',
            validate: {
                isIn: [['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']]
            }
        },
        preferredCurrency: {
            type: DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'USD',
            validate: {
                isIn: [['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR']]
            }
        },
        isVerified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        verificationStatus: {
            type: DataTypes.ENUM('pending', 'verified', 'rejected'),
            allowNull: false,
            defaultValue: 'pending'
        },
        verificationDocuments: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        preferences: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
                notifications: {
                    email: true,
                    sms: false,
                    push: true
                },
                privacy: {
                    showProfile: true,
                    showReviews: true
                }
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
        tableName: 'GuestProfiles',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            verified: { where: { isVerified: true } },
            unverified: { where: { isVerified: false } },
            byVerificationStatus: (status) => ({ where: { verificationStatus: status } }),
            byUser: (userId) => ({ where: { userId } })
        },
        indexes: [
            { unique: true, fields: ['userId'] },
            { fields: ['displayName'] },
            { fields: ['isVerified'] },
            { fields: ['verificationStatus'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] }
        ],
        validate: {
            async validUser() {
                const user = await sequelize.models.User.findByPk(this.userId);
                if (!user) throw new Error('Invalid user');
            },
            validPreferences() {
                if (this.preferences && typeof this.preferences !== 'object') {
                    throw new Error('Preferences must be an object');
                }
            }
        },
        hooks: {
            beforeCreate: (profile) => {
                if (!profile.displayName) {
                    profile.displayName = 'Guest';
                }
            },
            beforeSave: async (profile) => {
                if (!profile.displayName || profile.displayName === 'Guest') {
                    const user = await profile.getUser();
                    if (user && user.name) {
                        profile.displayName = user.name;
                    }
                }
            }
        }
    });

    // Class Methods
    GuestProfile.findByUser = function(userId) {
        return this.scope('byUser', userId).findOne();
    };

    GuestProfile.getVerifiedGuests = function() {
        return this.scope('verified').findAll();
    };

    // Instance Methods
    GuestProfile.prototype.updatePreferences = async function(newPreferences) {
        this.preferences = {
            ...this.preferences,
            ...newPreferences
        };
        return this.save();
    };

    GuestProfile.prototype.verify = async function(documents) {
        this.isVerified = true;
        this.verificationStatus = 'verified';
        this.verificationDocuments = documents;
        return this.save();
    };

    GuestProfile.prototype.rejectVerification = async function(reason) {
        this.isVerified = false;
        this.verificationStatus = 'rejected';
        this.metadata.rejectionReason = reason;
        return this.save();
    };

    GuestProfile.prototype.getProfileDetails = function() {
        return {
            id: this.id,
            displayName: this.displayName,
            phoneNumber: this.phoneNumber,
            preferredLanguage: this.preferredLanguage,
            preferredCurrency: this.preferredCurrency,
            isVerified: this.isVerified,
            verificationStatus: this.verificationStatus,
            preferences: this.preferences
        };
    };

    GuestProfile.prototype.updateDisplayNameFromUser = async function() {
        const user = await this.getUser();
        if (user && user.name) {
            this.displayName = user.name;
            await this.save();
        }
        return this;
    };

    // Associations
    GuestProfile.associate = models => {
        GuestProfile.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        GuestProfile.hasMany(models.Booking, {
            foreignKey: 'guestId',
            as: 'bookings'
        });
        GuestProfile.hasMany(models.Review, {
            foreignKey: 'guestId',
            as: 'reviews'
        });
        GuestProfile.hasMany(models.GuestVerification, {
            foreignKey: 'guestProfileId',
            as: 'verifications'
        });
        GuestProfile.hasOne(models.GuestPreferences, {
            foreignKey: 'guestProfileId',
            as: 'guestPreferences'
        });
    };

    return GuestProfile;
}; 