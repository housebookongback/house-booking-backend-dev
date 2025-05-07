const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const SearchHistory = sequelize.define('SearchHistory', {
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
        query: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                len: [1, 255]
            }
        },
        filters: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        location: {
            type: DataTypes.STRING(100),
            allowNull: true
        },
        coordinates: {
            type: DataTypes.GEOMETRY('POINT'),
            allowNull: true
        },
        radius: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: { min: 0 }
        },
        resultCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        viewedResults: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        clickedResults: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        deviceInfo: {
            type: DataTypes.JSON,
            allowNull: true
        },
        sessionId: {
            type: DataTypes.STRING,
            allowNull: true
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
        tableName: 'SearchHistories',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            byUser: (userId) => ({ where: { userId } }),
            bySession: (sessionId) => ({ where: { sessionId } }),
            recent: {
                order: [['createdAt', 'DESC']],
                limit: 10
            },
            withResults: {
                where: { resultCount: { [Op.gt]: 0 } }
            },
            withClicks: {
                where: { clickedResults: { [Op.gt]: 0 } }
            }
        },
        indexes: [
            { fields: ['userId'] },
            { fields: ['sessionId'] },
            { fields: ['createdAt'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] },
            // Spatial index for coordinates
            { fields: ['coordinates'], type: 'SPATIAL' }
        ],
        validate: {
            async validUser() {
                const user = await sequelize.models.User.findByPk(this.userId);
                if (!user) throw new Error('Invalid user');
            },
            validCoordinates() {
                if (this.coordinates && !this.location) {
                    throw new Error('Location is required when coordinates are provided');
                }
            }
        },
        hooks: {
            beforeCreate: async (history) => {
                // Set default device info if not provided
                if (!history.deviceInfo) {
                    history.deviceInfo = {
                        type: 'unknown',
                        platform: 'unknown',
                        browser: 'unknown'
                    };
                }
            }
        }
    });

    // Class Methods
    SearchHistory.findByUser = function(userId) {
        return this.scope('byUser', userId).findAll();
    };

    SearchHistory.findBySession = function(sessionId) {
        return this.scope('bySession', sessionId).findAll();
    };

    SearchHistory.getRecentSearches = function(userId, limit = 10) {
        return this.scope('byUser', userId)
            .scope('recent')
            .findAll({ limit });
    };

    // Instance Methods
    SearchHistory.prototype.updateResults = async function(count) {
        this.resultCount = count;
        return this.save();
    };

    SearchHistory.prototype.recordView = async function() {
        this.viewedResults += 1;
        return this.save();
    };

    SearchHistory.prototype.recordClick = async function() {
        this.clickedResults += 1;
        return this.save();
    };

    // Associations
    SearchHistory.associate = models => {
        SearchHistory.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return SearchHistory;
}; 