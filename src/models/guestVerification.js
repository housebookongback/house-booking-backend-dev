const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class GuestVerification extends Model {
        static associate(models) {
            GuestVerification.belongsTo(models.GuestProfile, {
                foreignKey: 'guestProfileId',
                as: 'guestProfile'
            });
            GuestVerification.belongsTo(models.User, {
                foreignKey: 'verifiedById',
                as: 'verifiedBy'
            });
        }
    }

    GuestVerification.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        guestProfileId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'GuestProfiles',
                key: 'id'
            }
        },
        documentType: {
            type: DataTypes.ENUM('passport', 'id_card', 'drivers_license', 'other'),
            allowNull: false
        },
        documentNumber: {
            type: DataTypes.STRING,
            allowNull: false
        },
        documentUrl: {
            type: DataTypes.STRING,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'verified', 'rejected'),
            allowNull: false,
            defaultValue: 'pending'
        },
        verifiedById: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        }
    }, {
        sequelize,
        modelName: 'GuestVerification',
        tableName: 'GuestVerifications',
        timestamps: true,
        paranoid: true,
        scopes: {
            pending: { where: { status: 'pending' } },
            verified: { where: { status: 'verified' } },
            rejected: { where: { status: 'rejected' } },
            byGuest: (guestProfileId) => ({ where: { guestProfileId } })
        },
        indexes: [
            { fields: ['guestProfileId'] },
            { fields: ['status'] },
            { fields: ['documentType'] },
            { fields: ['verifiedById'] }
        ],
        validate: {
            async validGuestProfile() {
                const guestProfile = await sequelize.models.GuestProfile.findByPk(this.guestProfileId);
                if (!guestProfile) throw new Error('Invalid guest profile');
            },
            async validVerifier() {
                if (this.verifiedById) {
                    const verifier = await sequelize.models.User.findByPk(this.verifiedById);
                    if (!verifier) throw new Error('Invalid verifier');
                }
            }
        },
        hooks: {
            beforeUpdate: async (verification) => {
                if (verification.changed('status') && verification.status === 'verified') {
                    verification.verifiedAt = new Date();
                }
            }
        }
    });

    // Class Methods
    GuestVerification.findByGuest = function(guestProfileId) {
        return this.scope('byGuest', guestProfileId).findAll();
    };

    GuestVerification.getPendingVerifications = function() {
        return this.scope('pending').findAll();
    };

    // Instance Methods
    GuestVerification.prototype.verify = async function(verifiedById) {
        return this.update({
            status: 'verified',
            verifiedById,
            verifiedAt: new Date()
        });
    };

    GuestVerification.prototype.reject = async function(reason, verifiedById) {
        return this.update({
            status: 'rejected',
            rejectionReason: reason,
            verifiedById,
            verifiedAt: new Date()
        });
    };

    return GuestVerification;
}; 