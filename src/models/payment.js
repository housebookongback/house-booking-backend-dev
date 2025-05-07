const { Op } = require('sequelize');
const currencies = require('../config/currencies');

module.exports = (sequelize, DataTypes) => {
    const Payment = sequelize.define('Payment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
            validate: {
                isIn: [currencies.supportedCurrencies]
            }
        },
        paymentMethod: {
            type: DataTypes.ENUM('credit_card', 'bank_transfer', 'paypal', 'stripe'),
            allowNull: false
        },
        paymentDetails: {
            type: DataTypes.JSON,
            allowNull: true,
            validate: {
                validSize(value) {
                    if (value && JSON.stringify(value).length > 10000) {
                        throw new Error('Payment details exceeds maximum size of 10KB');
                    }
                }
            }
        },
        idempotencyKey: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true
        },
        status: {
            type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed'),
            allowNull: false,
            defaultValue: 'pending'
        },
        processedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        completedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        refundedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        failureReason: {
            type: DataTypes.TEXT,
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
        tableName: 'Payments',
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
            completed: { where: { status: 'completed' } },
            failed: { where: { status: 'failed' } },
            refunded: { where: { status: 'refunded' } },
            disputed: { where: { status: 'disputed' } },
            byBooking: (bookingId) => ({ where: { bookingId } })
        },
        indexes: [
            { fields: ['bookingId'] },
            { fields: ['status'] },
            { fields: ['paymentMethod'] },
            { fields: ['processedAt'] },
            { fields: ['completedAt'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] },
            { fields: ['idempotencyKey'], unique: true }
        ],
        validate: {
            validAmount() {
                if (this.amount <= 0) {
                    throw new Error('Payment amount must be greater than zero');
                }
            },
            validStatusTransition() {
                if (this.changed('status')) {
                    const validTransitions = {
                        pending: ['processing', 'failed'],
                        processing: ['completed', 'failed', 'disputed'],
                        completed: ['refunded', 'disputed'],
                        failed: ['pending'],
                        refunded: [],
                        disputed: ['refunded']
                    };
                    
                    const oldStatus = this.previous('status');
                    const newStatus = this.status;
                    
                    if (!validTransitions[oldStatus]?.includes(newStatus)) {
                        throw new Error(`Invalid status transition from ${oldStatus} to ${newStatus}`);
                    }
                }
            }
        },
        hooks: {
            beforeUpdate: async (payment) => {
                if (payment.changed('status')) {
                    const now = new Date();
                    switch (payment.status) {
                        case 'processing':
                            payment.processedAt = now;
                            break;
                        case 'completed':
                            payment.completedAt = now;
                            break;
                        case 'refunded':
                            payment.refundedAt = now;
                            break;
                    }
                }
            }
        }
    });

    // Class Methods
    Payment.findByBooking = function(bookingId) {
        return this.scope('byBooking', bookingId).findAll();
    };

    Payment.getPendingPayments = function() {
        return this.scope('pending').findAll();
    };

    // Instance Methods
    Payment.prototype.process = async function() {
        this.status = 'processing';
        return this.save();
    };

    Payment.prototype.complete = async function() {
        this.status = 'completed';
        return this.save();
    };

    Payment.prototype.fail = async function(reason) {
        this.status = 'failed';
        this.failureReason = reason;
        return this.save();
    };

    Payment.prototype.refund = async function() {
        this.status = 'refunded';
        return this.save();
    };

    Payment.prototype.dispute = async function() {
        this.status = 'disputed';
        return this.save();
    };

    // Associations
    Payment.associate = models => {
        Payment.belongsTo(models.Booking, {
            foreignKey: 'bookingId',
            as: 'booking'
        });
    };

    return Payment;
}; 