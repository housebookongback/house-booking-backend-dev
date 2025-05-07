const { Op, literal, fn, col } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const ViewCount = sequelize.define('ViewCount', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        entityType: {
            type: DataTypes.ENUM('listing', 'user', 'category', 'location'),
            allowNull: false
        },
        entityId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: { min: 0 }
        },
        lastViewedAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        source: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Source of the view (e.g., search, recommendation, direct)'
        },
        deviceType: {
            type: DataTypes.ENUM('desktop', 'mobile', 'tablet'),
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        }
    }, {
        tableName: 'ViewCounts',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            byEntity: (type, id) => ({
                where: { entityType: type, entityId: id }
            }),
            recent: (days = 30) => ({
                where: {
                    lastViewedAt: {
                        [Op.gte]: literal(`CURRENT_DATE - INTERVAL '${days} days'`)
                    }
                }
            }),
            bySource: (src) => ({ where: { source: src } }),
            byDevice: (dev) => ({ where: { deviceType: dev } }),
            daily: {
                where: {
                    lastViewedAt: {
                        [Op.gte]: literal('CURRENT_DATE')
                    }
                }
            },
            weekly: {
                where: {
                    lastViewedAt: {
                        [Op.gte]: literal("CURRENT_DATE - INTERVAL '7 days'")
                    }
                }
            },
            monthly: {
                where: {
                    lastViewedAt: {
                        [Op.gte]: literal("CURRENT_DATE - INTERVAL '30 days'")
                    }
                }
            }
        },
        indexes: [
            { 
                fields: ['entityType', 'entityId'],
                unique: true,
                name: 'view_count_entity_idx'
            },
            { fields: ['lastViewedAt'] },
            { fields: ['source'] },
            { fields: ['deviceType'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] }
        ],
        validate: {
            validEntity() {
                const types = ['listing', 'user', 'category', 'location'];
                if (!types.includes(this.entityType)) {
                    throw new Error('Invalid entity type');
                }
            },
            async entityExists() {
                const model = sequelize.models[this.entityType.charAt(0).toUpperCase() + this.entityType.slice(1)];
                if (!model) {
                    throw new Error(`Model for entity type ${this.entityType} not found`);
                }
                const exists = await model.findByPk(this.entityId);
                if (!exists) {
                    throw new Error(`${this.entityType} with ID ${this.entityId} does not exist`);
                }
            }
        },
        hooks: {
            beforeCreate: (viewCount) => {
                viewCount.lastViewedAt = new Date();
            },
            beforeUpdate: (viewCount) => {
                if (viewCount.changed('count')) {
                    viewCount.lastViewedAt = new Date();
                }
            }
        }
    });

    // Class Methods
    ViewCount.incrementCount = async function(entityType, entityId, options = {}) {
        const [viewCount, created] = await this.findOrCreate({
            where: { entityType, entityId },
            defaults: {
                count: 1,
                source: options.source,
                deviceType: options.deviceType
            }
        });
        if (!created) {
            await viewCount.increment('count');
        }
        return viewCount;
    };

    ViewCount.getTopEntities = async function(entityType, limit = 10, options = {}) {
        return this.findAll({
            where: { entityType, ...options },
            order: [['count', 'DESC']],
            limit
        });
    };

    ViewCount.getViewStats = async function(entityType, entityId, period = 'monthly') {
        const stats = await this.findOne({
            where: { entityType, entityId },
            attributes: [
                'count',
                [fn('COUNT', col('source')), 'sourceCount'],
                [fn('COUNT', col('deviceType')), 'deviceCount']
            ],
            group: ['count'],
            include: [
                {
                    model: this,
                    as: 'sourceDistribution',
                    attributes: ['source', [fn('COUNT', '*'), 'count']],
                    group: ['source']
                },
                {
                    model: this,
                    as: 'deviceDistribution',
                    attributes: ['deviceType', [fn('COUNT', '*'), 'count']],
                    group: ['deviceType']
                }
            ]
        });

        return {
            totalViews: stats.count,
            sourceDistribution: stats.sourceDistribution,
            deviceDistribution: stats.deviceDistribution,
            period
        };
    };

    ViewCount.compareEntities = async function(entityType, entityIds) {
        return this.findAll({
            where: {
                entityType,
                entityId: { [Op.in]: entityIds }
            },
            attributes: ['entityId', 'count'],
            order: [['count', 'DESC']]
        });
    };

    // Instance Methods
    ViewCount.prototype.resetCount = async function() {
        return this.update({ count: 0 });
    };

    ViewCount.prototype.deactivate = async function() {
        return this.update({ isActive: false });
    };

    ViewCount.prototype.activate = async function() {
        return this.update({ isActive: true });
    };

    ViewCount.prototype.getTrend = async function(period = 'monthly') {
        const startDate = literal(`CURRENT_DATE - INTERVAL '1 ${period}'`);
        const endDate = literal('CURRENT_DATE');

        return this.findAll({
            where: {
                entityType: this.entityType,
                entityId: this.entityId,
                lastViewedAt: {
                    [Op.between]: [startDate, endDate]
                }
            },
            attributes: [
                [fn('DATE', col('lastViewedAt')), 'date'],
                [fn('SUM', col('count')), 'views']
            ],
            group: [fn('DATE', col('lastViewedAt'))],
            order: [[fn('DATE', col('lastViewedAt')), 'ASC']]
        });
    };

    ViewCount.associate = () => {
        // Polymorphic: no direct Sequelize associations
    };

    return ViewCount;
}; 