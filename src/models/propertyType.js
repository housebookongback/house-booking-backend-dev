module.exports = (sequelize, DataTypes) => {
    const PropertyType = sequelize.define('PropertyType', {
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
        tableName: 'PropertyTypes',
        timestamps: true,
        paranoid: true,                   // soft-deletes
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} }
        },
        indexes: [
            { unique: true, fields: ['name'] },
            { unique: true, fields: ['slug'] },
            { fields: ['isActive'] }
        ],
        hooks: {
            beforeValidate: (pt) => {
              pt.slug = pt.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            }
          }
    });

    PropertyType.associate = (models) => {
        // One property type can have many listings
        PropertyType.hasMany(models.Listing, {
            foreignKey: 'propertyTypeId',
            as: 'listings'
        });
    };

    return PropertyType;
}; 