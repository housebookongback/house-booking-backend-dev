const { Op, literal } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
    const Verification = sequelize.define('Verification', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        type: {
            type: DataTypes.ENUM(
                'email',
                'phone',
                'identity',
                'payment',
                'host',
                'government_id',
                'address',
                'other'
            ),
            allowNull: false,
        },
        method: {
            type: DataTypes.ENUM(
                'email',
                'sms',
                'document',
                'payment',
                'manual',
                'system'
            ),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'verified', 'failed', 'expired'),
            allowNull: false,
            defaultValue: 'pending',
        },
        token: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        code: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        verifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        verifiedById: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'Users', key: 'id' },
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
        },
        failureReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        }
    }, {
        tableName: 'Verifications',
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
            failed: { where: { status: 'failed' } },
            expired: { where: { status: 'expired' } },
            expiringSoon: (hours = 1) => ({
                where: {
                    expiresAt: {
                        [Op.lte]: literal(`CURRENT_TIMESTAMP + INTERVAL '${hours} hours'`),
                        [Op.gt]: literal('CURRENT_TIMESTAMP')
                    }
                }
            }),
            byType: (type) => ({ where: { type } }),
            byMethod: (method) => ({ where: { method } }),
            byUser: (userId) => ({ where: { userId } })
        },
        indexes: [
            { fields: ['userId'] },
            { fields: ['type'] },
            { fields: ['method'] },
            { fields: ['status'] },
            { fields: ['token'] },
            { fields: ['code'] },
            { fields: ['expiresAt'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] },
            { 
                fields: ['userId', 'type'],
                name: 'verification_user_type_idx'
            }
        ],
        validate: {
            async validUser() {
                const user = await sequelize.models.User.findByPk(this.userId);
                if (!user) throw new Error('Invalid user');
            },
            async validVerifier() {
                if (this.verifiedById) {
                    const v = await sequelize.models.User.findByPk(this.verifiedById);
                    if (!v) throw new Error('Invalid verifier');
                }
            },
            validExpiry() {
                if (this.expiresAt && this.expiresAt <= new Date()) {
                    throw new Error('Expiry must be in future');
                }
            },
            validTokenCode() {
                if (this.method === 'email' && !this.token) {
                    throw new Error('Token required for email');
                }
                if (this.method === 'sms' && !this.code) {
                    throw new Error('Code required for SMS');
                }
            }
        },
        hooks: {
            beforeCreate: (ver) => {
                if (['email', 'sms'].includes(ver.method) && !ver.expiresAt) {
                    ver.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                }
                if (ver.method === 'email' && !ver.token) {
                    ver.token = crypto.randomBytes(32).toString('hex');
                }
                if (ver.method === 'sms' && !ver.code) {
                    ver.code = Math.floor(100000 + Math.random() * 900000).toString();
                }
            },
            afterUpdate: async (ver) => {
                if (ver.status === 'pending' && ver.expiresAt && ver.expiresAt < new Date()) {
                    await ver.update({ status: 'expired' }, { hooks: false });
                }
            }
        }
    });

    // Class Methods
    Verification.findOrCreateForUser = async function(userId, type, method, opts = {}) {
        const [ver] = await this.findOrCreate({
            where: { userId, type, method },
            defaults: { ...opts }
        });
        return ver;
    };

    Verification.getExpiringVerifications = function(hours = 1) {
        return this.scope('expiringSoon', hours).findAll();
    };

    // Instance Methods
    Verification.prototype.verify = function(byId = null) {
        return this.update({ status: 'verified', verifiedAt: new Date(), verifiedById: byId });
    };

    Verification.prototype.fail = function(reason) {
        return this.update({ status: 'failed', failureReason: reason });
    };

    Verification.prototype.isExpired = function() {
        return this.expiresAt && this.expiresAt < new Date();
    };

    Verification.prototype.isValid = function() {
        return this.status === 'verified' && !this.isExpired();
    };

    Verification.prototype.resend = async function() {
        if (this.status !== 'pending') {
            throw new Error('Can only resend pending verifications');
        }
        
        // Generate new token/code based on method
        if (this.method === 'email') {
            this.token = crypto.randomBytes(32).toString('hex');
        } else if (this.method === 'sms') {
            this.code = Math.floor(100000 + Math.random() * 900000).toString();
        }
        
        // Reset expiry
        this.expiresAt = new Date();
        this.expiresAt.setHours(this.expiresAt.getHours() + 24);
        
        return this.save();
    };

    // Associations
    Verification.associate = (models) => {
        Verification.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
        Verification.belongsTo(models.User, {
            foreignKey: 'verifiedById',
            as: 'verifier'
        });
    };

    return Verification;
}; 