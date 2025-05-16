module.exports = (sequelize, DataTypes) => {
    const Location = sequelize.define('Location', {
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
        // Optional fields - won't interfere with core functionality
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
                model: 'Locations',
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
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true
          },
          state: {
            type: DataTypes.STRING,
            allowNull: true
          },
          country: {
            type: DataTypes.STRING,
            allowNull: true
          },
    }, {
        tableName: 'Locations',
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
                    throw new Error('Location cannot be its own parent');
                }
            }
        },
        hooks: {
            beforeValidate: (loc) => {
                if (loc.name && !loc.slug) {
                    loc.slug = loc.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
                }
            }
        }
    });

    Location.associate = (models) => {
        // One location can have many listings
        Location.hasMany(models.Listing, {
            foreignKey: 'locationId',
            as: 'listings',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });

        // Self-referential relationship for hierarchical locations
        Location.belongsTo(models.Location, {
            foreignKey: 'parentId',
            as: 'parent'
        });

        Location.hasMany(models.Location, {
            foreignKey: 'parentId',
            as: 'children'
        });
    };

    return Location;
}; 