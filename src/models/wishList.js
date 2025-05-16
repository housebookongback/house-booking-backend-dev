module.exports = (sequelize, DataTypes) => {
    const Wishlist = sequelize.define('Wishlist', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE'
        },
        listingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Listings', key: 'id' },
            onDelete: 'CASCADE'
        }
    }, {
        tableName: 'Wishlists',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['userId', 'listingId'] },
            { fields: ['userId'] },
            { fields: ['listingId'] }
        ]
    });

    // Associations
    Wishlist.associate = (models) => {
        Wishlist.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        Wishlist.belongsTo(models.Listing, { foreignKey: 'listingId', as: 'listing' });
    };

    return Wishlist;
};