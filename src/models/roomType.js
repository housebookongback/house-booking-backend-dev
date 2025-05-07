const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const RoomType = sequelize.define('RoomType', {
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
        tableName: 'RoomTypes',
        timestamps: true,
        paranoid: true,
        defaultScope: { where: { isActive: true } },
        scopes: { all: { where: {} } },
        indexes: [
            { unique: true, fields: ['name'] },
            { unique: true, fields: ['slug'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] }
        ],
        validate: {
            nameLength() {
                if (this.name.length < 2 || this.name.length > 100) {
                    throw new Error('Name must be between 2 and 100 characters');
                }
            }
        },
        hooks: {
            beforeValidate: (rt) => {
                if (rt.name && !rt.slug) {
                    rt.slug = rt.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
                }
            }
        }
    });

    RoomType.associate = (models) => {
        RoomType.hasMany(models.Listing, {
            foreignKey: 'roomTypeId',
            as: 'listings',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE'
        });
    };

    return RoomType;
}; 