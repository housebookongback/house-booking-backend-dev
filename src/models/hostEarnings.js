const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const HostEarnings = sequelize.define('HostEarnings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        hostProfileId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'HostProfiles', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        bookingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Bookings', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: { min: 0 }
        },
        currency: {
            type: DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'USD',
            validate: { len: [3, 3] }
        },
        type: {
            type: DataTypes.ENUM(
                'booking',
                'cleaning_fee',
                'security_deposit',
                'damage_fee',
                'late_checkout',
                'extra_guest',
                'other'
            ),
            allowNull: false,
            defaultValue: 'booking'
        },
        status: {
            type: DataTypes.ENUM('pending','processing','paid','failed','refunded'),
            allowNull: false,
            defaultValue: 'pending'
        },
        paymentMethod: {
            type: DataTypes.ENUM('bank_transfer','paypal','stripe','other'),
            allowNull: true
        },
        paymentDetails: {
            type: DataTypes.JSON,
            allowNull: true
        },
        processedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        paidAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'HostEarnings',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            pending: { where: { status: 'pending' } },
            processing: { where: { status: 'processing' } },
            paid: { where: { status: 'paid' } },
            failed: { where: { status: 'failed' } },
            refunded: { where: { status: 'refunded' } },
            byHost: (hostProfileId) => ({ where: { hostProfileId } }),
            byBooking: (bookingId) => ({ where: { bookingId } }),
            byType: (type) => ({ where: { type } }),
            byDateRange: (startDate, endDate) => ({
                where: {
                    createdAt: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            })
        },
        indexes: [
            { fields: ['hostProfileId'] },
            { fields: ['bookingId'] },
            { fields: ['type'] },
            { fields: ['status'] },
            { fields: ['processedAt'] },
            { fields: ['paidAt'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] },
            { fields: ['isActive','deletedAt'] }
        ],
        validate: {
            async validHostProfile() {
                const profile = await sequelize.models.HostProfile.findByPk(this.hostProfileId);
                if (!profile) throw new Error('Invalid host profile');
            },
            async validBooking() {
                const booking = await sequelize.models.Booking.findByPk(this.bookingId);
                if (!booking) throw new Error('Invalid booking');
            },
            validAmount() {
                if (this.amount <= 0) {
                    throw new Error('Amount must be greater than 0');
                }
            },
            validPaymentDetails() {
                if (this.paymentDetails && typeof this.paymentDetails !== 'object') {
                    throw new Error('Payment details must be an object');
                }
            }
        },
        hooks: {
            beforeCreate: (earning) => {
                if (!earning.currency) {
                    earning.currency = 'USD';
                }
            },
            afterUpdate: async (earning) => {
                if (earning.changed('status')) {
                    const now = new Date();
                    if (earning.status === 'processing') {
                        earning.processedAt = now;
                    } else if (earning.status === 'paid') {
                        earning.paidAt = now;
                    }
                }
            }
        }
    });

    // Class Methods
    HostEarnings.findByHost = function(hostProfileId) {
        return this.scope('byHost', hostProfileId).findAll();
    };

    HostEarnings.findByBooking = function(bookingId) {
        return this.scope('byBooking', bookingId).findAll();
    };

    HostEarnings.getPendingEarnings = function() {
        return this.scope('pending').findAll();
    };

    HostEarnings.getTotalEarnings = async function(hostProfileId, startDate, endDate) {
        const result = await this.scope('byHost', hostProfileId)
            .scope('byDateRange', startDate, endDate)
            .scope('paid')
            .findAll({
                attributes: [
                    [sequelize.fn('SUM', sequelize.col('amount')), 'total']
                ]
            });
        return result[0]?.getDataValue('total') || 0;
    };

    // Instance Methods
    HostEarnings.prototype.processPayment = async function(paymentMethod, details) {
        return this.update({
            status: 'processing',
            paymentMethod,
            paymentDetails: details
        });
    };

    HostEarnings.prototype.markAsPaid = function() {
        return this.update({ status: 'paid' });
    };

    HostEarnings.prototype.markAsFailed = function(reason) {
        return this.update({ 
            status: 'failed',
            notes: reason
        });
    };

    HostEarnings.prototype.refund = function(reason) {
        return this.update({ 
            status: 'refunded',
            notes: reason
        });
    };

    HostEarnings.prototype.getEarningDetails = function() {
        return {
            id: this.id,
            amount: this.amount,
            currency: this.currency,
            type: this.type,
            status: this.status,
            paymentMethod: this.paymentMethod,
            processedAt: this.processedAt,
            paidAt: this.paidAt,
            notes: this.notes,
            metadata: this.metadata
        };
    };

    // Associations
    HostEarnings.associate = (models) => {
        HostEarnings.belongsTo(models.HostProfile, {
            foreignKey: 'hostProfileId',
            as: 'hostProfile'
        });
        HostEarnings.belongsTo(models.Booking, {
            foreignKey: 'bookingId',
            as: 'booking'
        });
    };

    return HostEarnings;
}; 