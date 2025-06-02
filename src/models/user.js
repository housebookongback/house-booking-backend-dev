module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: { 
            type: DataTypes.STRING,  
            allowNull: false 
        },
        email: { 
            type: DataTypes.STRING,  
            allowNull: false, 
            unique: true, 
            validate: { isEmail: true } 
        },
        googleId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        passwordHash: { 
            type: DataTypes.STRING,  
            allowNull: false 
        },
        phone: { 
            type: DataTypes.STRING,  
            allowNull: true 
        },
        isVerified: { 
            type: DataTypes.BOOLEAN, 
            defaultValue: false 
        },
        emailVerifiedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        emailVerificationToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        passwordResetToken: {
            type: DataTypes.STRING,
            allowNull: true
        },
        passwordResetExpires: {
            type: DataTypes.DATE,
            allowNull: true
        },
        profilePicture: { 
            type: DataTypes.STRING,  
            allowNull: true 
        },
        bio: { 
            type: DataTypes.TEXT,    
            allowNull: true 
        },
        language: { 
            type: DataTypes.STRING,  
            defaultValue: 'en' 
        },
        currency: { 
            type: DataTypes.STRING,  
            defaultValue: 'USD' 
        },
        timezone: {
            type: DataTypes.STRING,
            defaultValue: 'UTC'
        },
        country: {
            type: DataTypes.STRING,
            allowNull: true
        },
        address: {
            type: DataTypes.JSON,
            allowNull: true
        },
        notificationPreferences: {
            type: DataTypes.JSON,
            defaultValue: {
                channels: { 
                    email: true, 
                    push: true, 
                    sms: false 
                },
                types: {
                    priceAlerts: true,
                    newListings: true,
                    bookingUpdates: true,
                    specialOffers: true,
                    availabilityUpdates: true,
                    reviewRequests: true
                },
                frequency: {
                    priceAlerts: 'immediate',
                    newListings: 'immediate',
                    specialOffers: 'immediate'
                }
            }
        },
        pushSubscriptions: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: []
        },
        privacySettings: {
            type: DataTypes.JSON,
            defaultValue: {
                profileVisibility: 'public',
                showEmail: false,
                showPhone: false
            }
        },
        dataConsent: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        socialLinks: {
            type: DataTypes.JSON,
            allowNull: true
        },
        referralCode: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true
        },
        referredBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        lastLogin: { 
            type: DataTypes.DATE,    
            allowNull: true 
        },
        lastActivity: {
            type: DataTypes.DATE,
            allowNull: true
        },
        status: { 
            type: DataTypes.STRING, 
            allowNull: false,
            defaultValue: 'active',
            validate: {
                isIn: [['active', 'pending', 'banned']]
            }
        },
        banReason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        bannedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        bannedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'Users',
        timestamps: true,      // enable built-in createdAt/updatedAt
        indexes: [
            {
                unique: true,
                fields: ['email']
            },
            {
                fields: ['status']
            },
            {
                fields: ['lastActivity']
            }
        ]
    });

    User.associate = (models) => {
        // Existing relationships...
        User.belongsToMany(models.Role, {
            through: models.UserRoles,
            foreignKey: 'userId',
            otherKey: 'roleId',
            as: 'roles',
        });

        // Referral relationships
        User.belongsTo(models.User, {
            as: 'referrer',
            foreignKey: 'referredBy',
        });
        User.hasMany(models.User, {
            as: 'referrals',
            foreignKey: 'referredBy',
        });

        User.hasOne(models.Verification, { foreignKey: 'userId', as: 'verification' });
        User.hasMany(models.Document, { foreignKey: 'userId', as: 'documents' });
        User.hasOne(models.HostProfile, { foreignKey: 'userId', as: 'hostProfile' });
        User.hasMany(models.HostVerification, { foreignKey: 'userId', as: 'hostVerifications' });
        User.hasMany(models.HostEarnings, { foreignKey: 'userId', as: 'hostEarnings' });
        User.hasOne(models.GuestProfile, { foreignKey: 'userId', as: 'guestProfile' });
        User.hasMany(models.GuestPreferences, { foreignKey: 'userId', as: 'guestPreferences' });
        User.hasMany(models.Listing, { foreignKey: 'hostId', as: 'listings' });
        User.hasMany(models.Booking, { foreignKey: 'userId', as: 'bookings' });
        User.hasMany(models.BookingRequest, { foreignKey: 'userId', as: 'bookingRequests' });
        User.hasMany(models.BookingChange, { foreignKey: 'userId', as: 'bookingChanges' });
        User.hasMany(models.BookingCancellation, { foreignKey: 'userId', as: 'bookingCancellations' });
        User.hasMany(models.Review, { foreignKey: 'userId', as: 'reviews' });
        User.hasMany(models.ReviewResponse, { foreignKey: 'userId', as: 'reviewResponses' });
        User.hasMany(models.ReviewReport, { foreignKey: 'userId', as: 'reviewReports' });
        
        // Remove old conversation associations
        // User.hasMany(models.Conversation, { foreignKey: 'userA', as: 'conversationsAsA' });
        // User.hasMany(models.Conversation, { foreignKey: 'userB', as: 'conversationsAsB' });
        
        // Add new conversation associations
        User.belongsToMany(models.Conversation, {
          through: models.ConversationParticipant,
          foreignKey: 'userId',
          otherKey: 'conversationId',
          as: 'conversations',
        });
        User.hasMany(models.ConversationParticipant, {
          foreignKey: 'userId',
          as: 'conversationParticipants',
        });
        
        User.hasMany(models.Message, { foreignKey: 'senderId', as: 'sentMessages' });
        User.hasMany(models.MessageAttachment, { 
            foreignKey: 'uploaderId', 
            as: 'messageAttachments' 
        });
        User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
        User.hasMany(models.SearchHistory, { foreignKey: 'userId', as: 'searchHistories' });
        User.hasMany(models.SearchFilter, { foreignKey: 'userId', as: 'searchFilters' });
        User.hasMany(models.Payment, { foreignKey: 'userId', as: 'payments' });
        User.hasMany(models.PayoutAccount, { foreignKey: 'userId', as: 'payoutAccounts' });
        User.hasMany(models.Report, { foreignKey: 'reporterId', as: 'reportsMade' });
        User.hasMany(models.Report, { foreignKey: 'reportedUserId', as: 'reportsAgainstUser' });
        User.hasMany(models.ViewCount, { foreignKey: 'userId', as: 'viewCounts' });
        User.hasMany(models.ClickCount, { foreignKey: 'userId', as: 'clickCounts' });
        User.hasMany(models.Maintenance, { foreignKey: 'userId', as: 'maintenances' });
        User.hasMany(models.Wishlist, { foreignKey: 'userId', as: 'wishlists' });
    };

    // Add these methods here, before return User
    const crypto = require('crypto');

    // Generate email verification token
    User.prototype.generateVerificationToken = function () {
        const token = crypto.randomBytes(32).toString('hex');
        this.emailVerificationToken = token;
        return token;
    };

    // Generate password reset token
    User.prototype.generatePasswordResetToken = function () {
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
        this.passwordResetToken = token;
        this.passwordResetExpires = expires;
        return token;
    };

    return User;
};