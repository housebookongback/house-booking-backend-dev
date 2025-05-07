const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const HostVerification = sequelize.define('HostVerification', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        hostId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        type: {
            type: DataTypes.ENUM(
                'identity',
                'address',
                'phone',
                'email',
                'payment',
                'government_id',
                'business_registration',
                'tax_document',
                'other'
            ),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending','verified','rejected','expired'),
            allowNull: false,
            defaultValue: 'pending'
        },
        documents: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        verifiedById: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'Users', key: 'id' }
        },
        rejectedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        rejectedById: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'Users', key: 'id' }
        },
        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true
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
        tableName: 'HostVerifications',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            pending: { where: { status: 'pending' } },
            verified: { where: { status: 'verified' } },
            rejected: { where: { status: 'rejected' } },
            expired: { where: { status: 'expired' } },
            byType: (type) => ({ where: { type } }),
            byHost: (hostId) => ({ where: { hostId } }),
            expiringSoon: {
                where: {
                    status: 'verified',
                    expiresAt: {
                        [Op.lte]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                    }
                }
            }
        },
        indexes: [
            { fields: ['hostId'] },
            { fields: ['type'] },
            { fields: ['status'] },
            { fields: ['verifiedAt'] },
            { fields: ['expiresAt'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] },
            { fields: ['isActive','deletedAt'] }
        ],
        validate: {
            async validHost() {
                const host = await sequelize.models.User.findByPk(this.hostId);
                if (!host) throw new Error('Invalid host');
            },
            async validVerifier() {
                if (this.verifiedById) {
                    const verifier = await sequelize.models.User.findByPk(this.verifiedById);
                    if (!verifier) throw new Error('Invalid verifier');
                }
            },
            async validRejecter() {
                if (this.rejectedById) {
                    const rejecter = await sequelize.models.User.findByPk(this.rejectedById);
                    if (!rejecter) throw new Error('Invalid rejecter');
                }
            },
            validDocuments() {
                if (this.documents && typeof this.documents !== 'object') {
                    throw new Error('Documents must be an object');
                }
            },
            validMetadata() {
                if (this.metadata && typeof this.metadata !== 'object') {
                    throw new Error('Metadata must be an object');
                }
            }
        },
        hooks: {
            beforeUpdate: (verification) => {
                if (verification.changed('status')) {
                    const now = new Date();
                    if (verification.status === 'verified') {
                        verification.verifiedAt = now;
                    } else if (verification.status === 'rejected') {
                        verification.rejectedAt = now;
                    }
                }
            }
        }
    });

    // Class Methods
    HostVerification.findByHost = function(hostId) {
        return this.scope('byHost', hostId).findAll();
    };

    HostVerification.findByType = function(hostId, type) {
        return this.scope('byHost', hostId)
            .scope('byType', type)
            .findAll();
    };

    HostVerification.getPendingVerifications = function() {
        return this.scope('pending').findAll();
    };

    HostVerification.getExpiringVerifications = function() {
        return this.scope('expiringSoon').findAll();
    };

    // Instance Methods
    HostVerification.prototype.verify = async function(verifierId) {
        return this.update({
            status: 'verified',
            verifiedById: verifierId,
            verifiedAt: new Date()
        });
    };

    HostVerification.prototype.reject = async function(rejecterId, reason) {
        return this.update({
            status: 'rejected',
            rejectedById: rejecterId,
            rejectedAt: new Date(),
            rejectionReason: reason
        });
    };

    HostVerification.prototype.updateDocuments = function(newDocuments) {
        return this.update({ documents: { ...this.documents, ...newDocuments } });
    };

    HostVerification.prototype.getVerificationDetails = function() {
        return {
            id: this.id,
            type: this.type,
            status: this.status,
            documents: this.documents,
            verifiedAt: this.verifiedAt,
            verifiedById: this.verifiedById,
            rejectedAt: this.rejectedAt,
            rejectedById: this.rejectedById,
            rejectionReason: this.rejectionReason,
            expiresAt: this.expiresAt,
            metadata: this.metadata
        };
    };

    // Associations
    HostVerification.associate = (models) => {
        HostVerification.belongsTo(models.User, {
            foreignKey: 'hostId',
            as: 'host'
        });
        HostVerification.belongsTo(models.User, {
            foreignKey: 'verifiedById',
            as: 'verifier'
        });
        HostVerification.belongsTo(models.User, {
            foreignKey: 'rejectedById',
            as: 'rejecter'
        });
    };

    return HostVerification;
}; 