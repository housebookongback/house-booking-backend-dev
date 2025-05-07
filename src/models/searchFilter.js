const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const SearchFilter = sequelize.define('SearchFilter', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                len: [1, 100]
            }
        },
        filters: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
            validate: {
                validFilters(value) {
                    if (!value || typeof value !== 'object') {
                        throw new Error('Filters must be a valid object');
                    }
                    // Validate common filter fields
                    const validFields = [
                        'priceRange',
                        'propertyTypes',
                        'amenities',
                        'locations',
                        'dates',
                        'guests',
                        'instantBook',
                        'superhostOnly'
                    ];
                    for (const key in value) {
                        if (!validFields.includes(key)) {
                            throw new Error(`Invalid filter field: ${key}`);
                        }
                    }
                }
            }
        },
        isDefault: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        lastUsedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        useCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'SearchFilters',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            default: { where: { isDefault: true } },
            byUser: (userId) => ({ where: { userId } }),
            recentlyUsed: {
                order: [['lastUsedAt', 'DESC']]
            },
            mostUsed: {
                order: [['useCount', 'DESC']]
            }
        },
        indexes: [
            { fields: ['userId'] },
            { fields: ['isDefault'] },
            { fields: ['lastUsedAt'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] },
            // Partial unique index for default filter per user
            {
                fields: ['userId'],
                where: { isDefault: true },
                unique: true
            }
        ],
        validate: {
            async validUser() {
                const user = await sequelize.models.User.findByPk(this.userId);
                if (!user) throw new Error('Invalid user');
            }
        },
        hooks: {
            beforeCreate: async (filter) => {
                // If this is the first filter for the user, make it default
                const existingFilters = await sequelize.models.SearchFilter.count({
                    where: { userId: filter.userId }
                });
                if (existingFilters === 0) {
                    filter.isDefault = true;
                }
            },
            beforeUpdate: async (filter, opts) => {
                if (filter.changed('isDefault') && filter.isDefault) {
                    await sequelize.transaction(async t => {
                        await SearchFilter.update(
                            { isDefault: false },
                            {
                                where: {
                                    userId: filter.userId,
                                    id: { [Op.ne]: filter.id }
                                },
                                transaction: t
                            }
                        );
                    });
                }
            }
        }
    });

    // Class Methods
    SearchFilter.findByUser = function(userId) {
        return this.scope('byUser', userId).findAll();
    };

    SearchFilter.getDefaultForUser = function(userId) {
        return this.scope('default').findOne({ where: { userId } });
    };

    // Instance Methods
    SearchFilter.prototype.setAsDefault = async function() {
        this.isDefault = true;
        return this.save();
    };

    SearchFilter.prototype.updateFilters = async function(newFilters) {
        this.filters = { ...this.filters, ...newFilters };
        return this.save();
    };

    SearchFilter.prototype.recordUsage = async function() {
        this.lastUsedAt = new Date();
        this.useCount += 1;
        return this.save();
    };

    // Associations
    SearchFilter.associate = models => {
        SearchFilter.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return SearchFilter;
}; 