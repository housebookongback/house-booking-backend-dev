// src/models/clickCount.js
const { Op, literal, fn, col } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const ClickCount = sequelize.define('ClickCount', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    entityType: {
      type: DataTypes.ENUM('listing', 'user', 'category', 'location'),
      allowNull: false,
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 }
    },
    lastClickedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Source of the click (e.g., search, recommendation, direct)'
    },
    deviceType: {
      type: DataTypes.ENUM('desktop', 'mobile', 'tablet'),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'ClickCounts',
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
          lastClickedAt: {
            [Op.gte]: literal(`CURRENT_DATE - INTERVAL '${days} days'`)
          }
        }
      }),
      bySource: (src) => ({ where: { source: src } }),
      byDevice: (dev) => ({ where: { deviceType: dev } }),
      daily: {
        where: {
          lastClickedAt: {
            [Op.gte]: literal('CURRENT_DATE')
          }
        }
      },
      weekly: {
        where: {
          lastClickedAt: {
            [Op.gte]: literal("CURRENT_DATE - INTERVAL '7 days'")
          }
        }
      },
      monthly: {
        where: {
          lastClickedAt: {
            [Op.gte]: literal("CURRENT_DATE - INTERVAL '30 days'")
          }
        }
      }
    },
    indexes: [
      { 
        fields: ['entityType', 'entityId'],
        unique: true,
        name: 'click_count_entity_idx'
      },
      { fields: ['lastClickedAt'] },
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
      beforeCreate: (clickCount) => {
        clickCount.lastClickedAt = new Date();
      },
      beforeUpdate: (clickCount) => {
        if (clickCount.changed('count')) {
          clickCount.lastClickedAt = new Date();
        }
      }
    }
  });

  // Class Methods
  ClickCount.incrementCount = async function(entityType, entityId, options = {}) {
    const [clickCount, created] = await this.findOrCreate({
      where: { entityType, entityId },
      defaults: {
        count: 1,
        source: options.source,
        deviceType: options.deviceType
      }
    });
    if (!created) {
      await clickCount.increment('count');
    }
    return clickCount;
  };

  ClickCount.getTopEntities = async function(entityType, limit = 10, options = {}) {
    return this.findAll({
      where: { entityType, ...options },
      order: [['count', 'DESC']],
      limit
    });
  };

  ClickCount.getClickStats = async function(entityType, entityId, period = 'monthly') {
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
      totalClicks: stats.count,
      sourceDistribution: stats.sourceDistribution,
      deviceDistribution: stats.deviceDistribution,
      period
    };
  };

  ClickCount.compareEntities = async function(entityType, entityIds) {
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
  ClickCount.prototype.resetCount = async function() {
    return this.update({ count: 0 });
  };

  ClickCount.prototype.deactivate = async function() {
    return this.update({ isActive: false });
  };

  ClickCount.prototype.activate = async function() {
    return this.update({ isActive: true });
  };

  ClickCount.prototype.getTrend = async function(period = 'monthly') {
    const startDate = literal(`CURRENT_DATE - INTERVAL '1 ${period}'`);
    const endDate = literal('CURRENT_DATE');

    return this.findAll({
      where: {
        entityType: this.entityType,
        entityId: this.entityId,
        lastClickedAt: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [fn('DATE', col('lastClickedAt')), 'date'],
        [fn('SUM', col('count')), 'clicks']
      ],
      group: [fn('DATE', col('lastClickedAt'))],
      order: [[fn('DATE', col('lastClickedAt')), 'ASC']]
    });
  };

  ClickCount.associate = () => {
    // Polymorphic: no direct Sequelize associations
  };

  return ClickCount;
};
