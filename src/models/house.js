module.exports = (sequelize, DataTypes) => {
  const House = sequelize.define('House', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    bedrooms: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    bathrooms: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  // Define associations
  House.associate = (models) => {
    // A house belongs to a host (user)
    House.belongsTo(models.User, {
      foreignKey: 'hostId',
      as: 'host'
    });

    // A house can have many bookings
    House.hasMany(models.Booking, {
      foreignKey: 'houseId',
      as: 'bookings'
    });
  };

  return House;
}; 