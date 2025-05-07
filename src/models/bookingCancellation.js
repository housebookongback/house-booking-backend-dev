module.exports = (sequelize, DataTypes) => {
    const BookingCancellation = sequelize.define('BookingCancellation', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        bookingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Bookings', key: 'id' },
            onDelete:  'CASCADE',
            onUpdate:  'CASCADE',
          },
        cancelledBy: {
            type: DataTypes.ENUM('guest', 'host', 'system'),
            allowNull: false,
        },
        cancelledById: {
            type: DataTypes.INTEGER,
            allowNull: true,   // nullable for system cancellations
            references: {
                model: 'Users',
                key: 'id'
            }
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        refundAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        cancellationFee: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        cancellationDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
        }
    }, {
        tableName: 'BookingCancellations',
        timestamps: true,
        paranoid: true,                   // soft-deletes
        scopes: {
            pending: { where: { status: 'pending' } },
            approved: { where: { status: 'approved' } },
            rejected: { where: { status: 'rejected' } }
        },
        indexes: [
            { unique: true, fields: ['bookingId'] },  // one cancellation per booking
            { fields: ['cancelledById'] },
            { fields: ['cancellationDate'] },
            { fields: ['status'] },
            { fields: ['deletedAt'] }
        ],
        validate: {
            validRefundAmount() {
                if (this.refundAmount !== null && this.refundAmount < 0) {
                    throw new Error('Refund amount cannot be negative');
                }
            },
            validCancellationFee() {
                if (this.cancellationFee !== null && this.cancellationFee < 0) {
                    throw new Error('Cancellation fee cannot be negative');
                }
            },
            cancelledByUserRequired() {
                if (this.cancelledBy !== 'system' && !this.cancelledById) {
                    throw new Error('cancelledById is required when cancelledBy is guest or host');
                }
            }
        }
    });

    BookingCancellation.associate = (models) => {
        // Cancellation belongs to a Booking
        BookingCancellation.belongsTo(models.Booking, {
            foreignKey: 'bookingId',
            as: 'booking'
        });

        // Cancellation belongs to the user who cancelled it
        BookingCancellation.belongsTo(models.User, {
            foreignKey: 'cancelledById',
            as: 'cancelledByUser'
        });
    };

    return BookingCancellation;
}; 