// src/models/hostProfile.js
module.exports = (sequelize, DataTypes) => {
    const HostProfile = sequelize.define('HostProfile', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [2, 50]
        }
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      profilePicture: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isUrl: true }
      },
      phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { is: /^\+?[1-9]\d{1,14}$/ }
      },
      preferredLanguage: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'en',
        validate: {
          isIn: [['en','es','fr','de','it','pt','ru','zh','ja','ko']]
        }
      },
      responseTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 0 }
      },
      responseRate: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true,
        validate: { min: 0, max: 100 }
      },
      isSuperhost: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      superhostSince: {
        type: DataTypes.DATE,
        allowNull: true
      },
      verificationStatus: {
        type: DataTypes.ENUM('unverified','pending','verified','rejected'),
        allowNull: false,
        defaultValue: 'unverified'
      },
      verificationDocuments: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
      },
      notificationPreferences: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {
          email: true,
          sms: false,
          push: true,
          bookingRequests: true,
          messages: true,
          reviews: true,
          updates: true
        }
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    }, {
      tableName: 'HostProfiles',
      timestamps: true,
      paranoid: true,
      defaultScope: {
        where: { isActive: true }
      },
      scopes: {
        all: { where: {} },
        inactive: { where: { isActive: false } },
        superhosts: { where: { isSuperhost: true } },
        verified: { where: { verificationStatus: 'verified' } },
        pendingVerification: { where: { verificationStatus: 'pending' } },
        byLanguage: (lang) => ({ where: { preferredLanguage: lang } })
      },
      indexes: [
        { unique: true, fields: ['userId'] },
        { fields: ['displayName'] },
        { fields: ['isSuperhost'] },
        { fields: ['verificationStatus'] },
        { fields: ['isActive'] },
        { fields: ['deletedAt'] },
        { fields: ['isActive','deletedAt'] }
      ],
      validate: {
        async validUser() {
          const user = await sequelize.models.User.findByPk(this.userId);
          if (!user) throw new Error('Invalid user');
        },
        validVerificationDocuments() {
          if (this.verificationDocuments && typeof this.verificationDocuments !== 'object') {
            throw new Error('Verification documents must be an object');
          }
        },
        validNotificationPreferences() {
          if (this.notificationPreferences && typeof this.notificationPreferences !== 'object') {
            throw new Error('Notification preferences must be an object');
          }
        }
      },
      hooks: {
        beforeUpdate: (profile) => {
          if (profile.changed('isSuperhost') && profile.isSuperhost) {
            profile.superhostSince = new Date();
          }
        }
      }
    });
  
    // Class Methods
    HostProfile.findByUser = function(userId) {
      return this.findOne({ where: { userId } });
    };
  
    HostProfile.findSuperhosts = function() {
      return this.scope('superhosts').findAll();
    };
  
    HostProfile.findVerified = function() {
      return this.scope('verified').findAll();
    };
  
    // Instance Methods
    HostProfile.prototype.updateVerificationStatus = function(status, documents) {
      const updates = { verificationStatus: status };
      if (documents) updates.verificationDocuments = documents;
      return this.update(updates);
    };
  
    HostProfile.prototype.updateNotificationPreferences = function(prefs) {
      return this.update({ notificationPreferences: {...this.notificationPreferences, ...prefs} });
    };
  
    HostProfile.prototype.getProfileDetails = function() {
      return {
        id: this.id,
        userId: this.userId,
        user: this.user ? {
          id: this.user.id,
          email: this.user.email,
          name: this.user.name,
          phone: this.user.phone,
          isVerified: this.user.isVerified,
          status: this.user.status
        } : null,
        displayName: this.displayName,
        bio: this.bio,
        profilePicture: this.profilePicture,
        phoneNumber: this.phoneNumber,
        preferredLanguage: this.preferredLanguage,
        responseTime: this.responseTime,
        responseRate: this.responseRate,
        isSuperhost: this.isSuperhost,
        superhostSince: this.superhostSince,
        verificationStatus: this.verificationStatus,
        notificationPreferences: this.notificationPreferences
      };
    };
  
    // Associations
    HostProfile.associate = models => {
        HostProfile.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        HostProfile.hasMany(models.Listing, {
            foreignKey: 'hostProfileId',
            as: 'listings'
        });
        HostProfile.hasMany(models.PayoutAccount, {
            foreignKey: 'hostProfileId',
            as: 'payoutAccounts'
        });
        HostProfile.hasOne(models.PayoutAccount, {
            foreignKey: 'hostProfileId',
            as: 'defaultPayoutAccount',
            scope: { isDefault: true }
        });
    };
  
    return HostProfile;
  };
  