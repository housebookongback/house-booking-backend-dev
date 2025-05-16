// src/models/booking.js
const { Op, literal } = require('sequelize');
let ListingModel;
module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define('Booking', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    listingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Listings', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    guestId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    hostId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    checkIn: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    checkOut: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    numberOfGuests: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1 }
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0.01 }
    },
    status: {
      type: DataTypes.ENUM('pending','confirmed','cancelled','completed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending','paid','refunded','failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    specialRequests: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    }
  }, {
    tableName: 'Bookings',
    timestamps: true,
    paranoid:  true,
    defaultScope: {
      where: { isActive: true }
    },
    scopes: {
      all:       { where: {} },
      active:    { where: { isActive: true, status: { [Op.ne]: 'cancelled' } } },
      pending:   { where: { status: 'pending' } },
      confirmed: { where: { status: 'confirmed' } },
      cancelled: { where: { status: 'cancelled' } },
      completed: { where: { status: 'completed' } },
      upcoming:  { where: { checkIn: { [Op.gt]: literal('CURRENT_DATE') } } },
      ongoing:   { where: { checkIn: { [Op.lte]: literal('CURRENT_DATE') }, checkOut: { [Op.gte]: literal('CURRENT_DATE') } } },
      past:      { where: { checkOut: { [Op.lt]: literal('CURRENT_DATE') } } },
      byListing: listingId => ({ where: { listingId } }),
      byGuest:   guestId   => ({ where: { guestId } }),
      byHost:    hostId    => ({ where: { hostId } }),
    },
    indexes: [
      { fields: ['listingId'] },
      { fields: ['guestId'] },
      { fields: ['hostId'] },
      { fields: ['status'] },
      { fields: ['checkIn'] },
      { fields: ['checkOut'] },
      { fields: ['deletedAt'] },
      { 
        fields: ['cancelledBy', 'status'],
        name: 'booking_cancelled_by_status_idx'
      }
    ],
    validate: {
      checkOutAfterCheckIn() {
        if (this.checkOut <= this.checkIn) {
          throw new Error('Check-out date must be after check-in date');
        }
      }
    },
    hooks: {

      // beforeValidate: async booking => {
      //   // populate hostId from listing
      //   if (!booking.hostId) {
      //     const lst = await sequelize.models.Listing.findByPk(booking.listingId);
      //     booking.hostId = lst.hostId;
      //   }
      // },

      beforeValidate: async booking => {
        // Only attempt if listingId is defined and model is available
        if (!booking.hostId && ListingModel && booking.listingId) {
          const lst = await ListingModel.findByPk(booking.listingId);
          if (lst) {
            booking.hostId = lst.hostId;
          } else {
            throw new Error('Listing not found for given listingId');
          }
        }
      },

      beforeCreate: async booking => {
        // conflict check
        const conflict = await booking.checkDateConflicts();
        if (conflict.length) throw new Error('Dates conflict with an existing booking');
      },
      beforeUpdate: async booking => {
        if (booking.changed('checkIn') || booking.changed('checkOut')) {
          const conflicts = await booking.checkDateConflicts();
          if (conflicts.length) throw new Error('Updated dates conflict with an existing booking');
        }
      }
    }
  });

  // Class Methods
  Booking.findByListing = listingId  => Booking.scope('byListing', listingId).findAll();
  Booking.findByGuest   = guestId    => Booking.scope('byGuest', guestId).findAll();
  Booking.findByHost    = hostId     => Booking.scope('byHost', hostId).findAll();
  Booking.findUpcoming  = ()         => Booking.scope('upcoming').findAll();
  Booking.findOngoing   = ()         => Booking.scope('ongoing').findAll();
  Booking.findPast      = ()         => Booking.scope('past').findAll();

  // Instance Methods
  Booking.prototype.getDuration = function() {
    const start = new Date(this.checkIn);
    const end   = new Date(this.checkOut);
    const ms    = end - start;
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  };

  Booking.prototype.cancel = async function(reason) {
    return this.update({ status: 'cancelled', cancellationReason: reason });
  };

  Booking.prototype.confirm = function() {
    return this.update({ status: 'confirmed' });
  };

  Booking.prototype.complete = function() {
    return this.update({ status: 'completed' });
  };

  Booking.prototype.isUpcoming = function() {
    return new Date(this.checkIn) > new Date();
  };

  Booking.prototype.isOngoing = function() {
    const today = new Date();
    return new Date(this.checkIn) <= today && new Date(this.checkOut) >= today;
  };

  Booking.prototype.isPast = function() {
    return new Date(this.checkOut) < new Date();
  };

  Booking.prototype.checkDateConflicts = function() {
    return Booking.findAll({
      where: {
        listingId: this.listingId,
        status:     { [Op.notIn]: ['cancelled'] },
        checkIn:    { [Op.lt]: this.checkOut },
        checkOut:   { [Op.gt]: this.checkIn }
      }
    });
  };

  // Associations
  Booking.associate = models => {
    Booking.belongsTo(models.Listing, {  foreignKey: 'listingId', as: 'listing' });
    Booking.belongsTo(models.User,    {  foreignKey: 'guestId',   as: 'guest'   });
    Booking.belongsTo(models.User,    {  foreignKey: 'hostId',    as: 'host'    });
    Booking.belongsTo(models.User,    {  foreignKey: 'cancelledBy', as: 'cancelledByUser' });
    Booking.hasOne(models.BookingCancellation, { foreignKey: 'bookingId', as: 'cancellation' });
    Booking.hasMany(models.Message,   {  foreignKey: 'bookingId', as: 'messages' });
    Booking.hasOne(models.Review,     {  foreignKey: 'bookingId', as: 'review'   });
    Booking.hasMany(models.Payment,   {  foreignKey: 'bookingId', as: 'payments' });
    ListingModel = models.Listing;
  };

  return Booking;
};
