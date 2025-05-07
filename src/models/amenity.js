module.exports = (sequelize, DataTypes) => {
    const Amenity = sequelize.define('Amenity', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        parentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Amenities',
                key: 'id'
            }
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: true,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        }
    }, {
        tableName: 'Amenities',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} }
        },
        indexes: [
            { unique: true, fields: ['name'] },
            { unique: true, fields: ['slug'] },
            { fields: ['isActive'] },
            { fields: ['parentId'] },
            { fields: ['deletedAt'] },
            { fields: ['parentId', 'isActive'] }
        ],
        validate: {
            nameLength() {
                if (this.name.length < 2 || this.name.length > 100) {
                    throw new Error('Name must be between 2 and 100 characters');
                }
            },
            notSelfParent() {
                if (this.parentId === this.id) {
                    throw new Error('Amenity cannot be its own parent');
                }
            }
        },
        hooks: {
            beforeValidate: (amenity) => {
                if (amenity.name && !amenity.slug) {
                    amenity.slug = amenity.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
                }
            }
        }
    });

    Amenity.associate = (models) => {
        Amenity.belongsToMany(models.Listing, {
            through: models.ListingAmenities,
            foreignKey: 'amenityId',
            otherKey: 'listingId',
            as: 'listings',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        Amenity.belongsTo(models.Amenity, {
            foreignKey: 'parentId',
            as: 'parent'
        });

        Amenity.hasMany(models.Amenity, {
            foreignKey: 'parentId',
            as: 'children'
        });
    };

    return Amenity;
}; 