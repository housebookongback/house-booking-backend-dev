module.exports = (sequelize, DataTypes) => {
    const ListingAmenities = sequelize.define('ListingAmenities', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        listingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Listings',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        amenityId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Amenities',
                key: 'id'
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        }
    }, {
        tableName: 'listing_amenities',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['listingId', 'amenityId'],
                name: 'listing_amenity_unique_idx'
            },
            { fields: ['listingId'] },
            { fields: ['amenityId'] }
        ],
        validate: {
            async validListing() {
                const listing = await sequelize.models.Listing.findByPk(this.listingId);
                if (!listing) throw new Error('Invalid listing');
            },
            async validAmenity() {
                const amenity = await sequelize.models.Amenity.findByPk(this.amenityId);
                if (!amenity) throw new Error('Invalid amenity');
            }
        }
    });

    ListingAmenities.associate = (models) => {
        ListingAmenities.belongsTo(models.Listing, {
            foreignKey: 'listingId',
            as: 'listing'
        });
        ListingAmenities.belongsTo(models.Amenity, {
            foreignKey: 'amenityId',
            as: 'amenity'
        });
    };

    return ListingAmenities;
}; 