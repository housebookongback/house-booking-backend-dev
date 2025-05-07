// src/models/bookingChange.js
module.exports = (sequelize, DataTypes) => {
    const BookingChange = sequelize.define('BookingChange', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      bookingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Bookings', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      requestedBy: {
        type: DataTypes.ENUM('guest', 'host', 'system'),
        allowNull: false,
      },
      requestedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      changeType: {
        type: DataTypes.ENUM('dates', 'guests', 'price', 'other'),
        allowNull: false,
      },
      oldCheckIn: { type: DataTypes.DATEONLY, allowNull: true },
      newCheckIn: { type: DataTypes.DATEONLY, allowNull: true },
      oldCheckOut:{ type: DataTypes.DATEONLY, allowNull: true },
      newCheckOut:{ type: DataTypes.DATEONLY, allowNull: true },
      oldNumberOfGuests: { type: DataTypes.INTEGER, allowNull: true },
      newNumberOfGuests: { type: DataTypes.INTEGER, allowNull: true },
      oldTotalPrice: { type: DataTypes.DECIMAL(10,2), allowNull: true },
      newTotalPrice: { type: DataTypes.DECIMAL(10,2), allowNull: true },
      reason: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM('pending','approved','rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      changeDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      }
    }, {
      tableName: 'BookingChanges',
      timestamps: true,
      paranoid: true,
      scopes: {
        pending: { where: { status: 'pending' } },
        approved: { where: { status: 'approved' } },
        rejected: { where: { status: 'rejected' } },
        dateChanges: { where: { changeType: 'dates' } },
        guestChanges:{ where: { changeType: 'guests' } },
        priceChanges:{ where: { changeType: 'price' } }
      },
      indexes: [
        { fields: ['bookingId'] },
        { fields: ['requestedById'] },
        { fields: ['changeDate'] },
        { fields: ['status'] },
        { fields: ['changeType'] },
        { fields: ['deletedAt'] }
      ],
      validate: {
        validDateChange() {
          if (this.changeType === 'dates') {
            if (this.oldCheckIn == null || this.newCheckIn == null || 
                this.oldCheckOut == null || this.newCheckOut == null) {
              throw new Error('Date changes require both old and new dates');
            }
            if (this.newCheckOut <= this.newCheckIn) {
              throw new Error('New check-out date must be after new check-in date');
            }
          }
        },
        validGuestChange() {
          if (this.changeType === 'guests') {
            if (this.oldNumberOfGuests == null || this.newNumberOfGuests == null) {
              throw new Error('Guest changes require both old and new guest counts');
            }
            if (this.newNumberOfGuests < 1) {
              throw new Error('New guest count must be at least 1');
            }
          }
        },
        validPriceChange() {
          if (this.changeType === 'price') {
            if (this.oldTotalPrice == null || this.newTotalPrice == null) {
              throw new Error('Price changes require both old and new prices');
            }
            if (this.newTotalPrice <= 0) {
              throw new Error('New price must be greater than zero');
            }
          }
        },
        requestedByUserRequired() {
          if (this.requestedBy !== 'system' && this.requestedById == null) {
            throw new Error('requestedById is required when requestedBy is guest or host');
          }
        }
      }
    });
  
    BookingChange.associate = (models) => {
      BookingChange.belongsTo(models.Booking, {
        foreignKey: 'bookingId',
        as: 'booking'
      });
      BookingChange.belongsTo(models.User, {
        foreignKey: 'requestedById',
        as: 'requestedByUser'
      });
    };
  
    return BookingChange;
  };
  