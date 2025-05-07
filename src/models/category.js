module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
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
                model: 'Categories',
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
        tableName: 'Categories',
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
            { fields: ['deletedAt'] }
        ],
        hooks: {
            beforeValidate: (category) => {
                if (category.name && !category.slug) {
                    category.slug = category.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '');
                }
            }
        }
    });

    Category.associate = (models) => {
        Category.hasMany(models.Listing, {
            foreignKey: 'categoryId',
            as: 'listings'
        });
        Category.belongsTo(models.Category, {
            foreignKey: 'parentId',
            as: 'parent'
        });
        Category.hasMany(models.Category, {
            foreignKey: 'parentId',
            as: 'children'
        });
    };

    return Category;
};
