const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notification', {
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
        type: {
            type: DataTypes.ENUM('info', 'success', 'warning', 'error'),
            allowNull: false,
            defaultValue: 'info'
        },
        category: {
            type: DataTypes.ENUM('booking', 'payment', 'review', 'message', 'system'),
            allowNull: false,
            defaultValue: 'system'
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        readAt: {
            type: DataTypes.DATE,
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
        tableName: 'Notifications',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            unread: { where: { isRead: false } },
            byUser: (userId) => ({ where: { userId } }),
            byType: (type) => ({ where: { type } }),
            byCategory: (category) => ({ where: { category } }),
            recent: {
                order: [['createdAt', 'DESC']],
                limit: 50
            }
        },
        indexes: [
            { fields: ['userId'] },
            { fields: ['type'] },
            { fields: ['category'] },
            { fields: ['isRead'] },
            { fields: ['createdAt'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] }
        ],
        validate: {
            async validUser() {
                const user = await sequelize.models.User.findByPk(this.userId);
                if (!user) throw new Error('Invalid user');
            }
        },
        hooks: {
            beforeUpdate: async (notification) => {
                if (notification.changed('isRead') && notification.isRead) {
                    notification.readAt = new Date();
                }
            }
        }
    });

    // Class Methods
    Notification.findByUser = function(userId) {
        return this.scope('byUser', userId)
            .scope('recent')
            .findAll();
    };

    Notification.findUnreadByUser = function(userId) {
        return this.scope('byUser', userId)
            .scope('unread')
            .findAll();
    };

    Notification.markAllAsRead = function(userId) {
        return this.update(
            { isRead: true },
            { where: { userId, isRead: false } }
        );
    };

    // Instance Methods
    Notification.prototype.markAsRead = async function() {
        this.isRead = true;
        return this.save();
    };

    // Associations
    Notification.associate = models => {
        Notification.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user'
        });
    };

    return Notification;
}; 