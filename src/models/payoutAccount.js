const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const PayoutAccount = sequelize.define('PayoutAccount', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        hostProfileId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'HostProfiles', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        accountType: {
            type: DataTypes.ENUM('bank_account', 'paypal', 'stripe'),
            allowNull: false
        },
        accountDetails: {
            type: DataTypes.JSON,
            allowNull: false
        },
        isDefault: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
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
            allowNull: true
        },
        lastUsedAt: {
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
        tableName: 'PayoutAccounts',
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
            defaultAccount: { where: { isDefault: true } },
            byHost: (hostProfileId) => ({ where: { hostProfileId } })
        },
        indexes: [
            { fields: ['hostProfileId'] },
            { fields: ['accountType'] },
            { fields: ['isVerified'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] },
            // Partial unique index for default account per host
            {
                fields: ['hostProfileId'],
                where: { isDefault: true },
                unique: true,
                name: 'payout_accounts_default_per_host'
            }
        ],
        validate: {
            async validHostProfile() {
                const host = await sequelize.models.HostProfile.findByPk(this.hostProfileId);
                if (!host) throw new Error('Invalid host profile');
            },
            validAccountDetails() {
                if (!this.accountDetails || typeof this.accountDetails !== 'object') {
                    throw new Error('Account details must be a valid object');
                }
            }
        },
        hooks: {
            beforeCreate: async (account) => {
                // If this is the first account for the host, make it default
                const existingAccounts = await sequelize.models.PayoutAccount.count({
                    where: { hostProfileId: account.hostProfileId }
                });
                if (existingAccounts === 0) {
                    account.isDefault = true;
                }
            },
            beforeUpdate: async (account, opts) => {
                if (account.changed('isDefault') && account.isDefault) {
                    await sequelize.transaction(async t => {
                        await PayoutAccount.update(
                            { isDefault: false },
                            {
                                where: {
                                    hostProfileId: account.hostProfileId,
                                    id: { [Op.ne]: account.id }
                                },
                                transaction: t
                            }
                        );
                    });
                }
            }
        }
    });

    // Class Methods
    PayoutAccount.findByHost = function(hostProfileId) {
        return this.scope('byHost', hostProfileId).findAll();
    };

    PayoutAccount.getDefaultForHost = function(hostProfileId) {
        return this.scope('defaultAccount').findOne({ where: { hostProfileId } });
    };

    // Instance Methods
    PayoutAccount.prototype.verify = async function(documents) {
        this.isVerified = true;
        this.verificationStatus = 'verified';
        this.verificationDocuments = documents;
        return this.save();
    };

    PayoutAccount.prototype.reject = async function(reason) {
        this.isVerified = false;
        this.verificationStatus = 'rejected';
        this.metadata.rejectionReason = reason;
        return this.save();
    };

    PayoutAccount.prototype.setAsDefault = async function() {
        this.isDefault = true;
        return this.save();
    };

    // Associations
    PayoutAccount.associate = models => {
        PayoutAccount.belongsTo(models.HostProfile, {
            foreignKey: 'hostProfileId',
            as: 'hostProfile'
        });
    };

    return PayoutAccount;
}; 