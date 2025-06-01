const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        conversationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Conversations', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                len: [1, 1000]
            }
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
        tableName: 'Messages',
        timestamps: true,
        paranoid: true,
        defaultScope: {
            where: { isActive: true }
        },
        scopes: {
            all: { where: {} },
            inactive: { where: { isActive: false } },
            unread: { where: { isRead: false } },
            byConversation: (conversationId) => ({ where: { conversationId } }),
            bySender: (senderId) => ({ where: { senderId } }),
            recent: {
                order: [['createdAt', 'DESC']],
                limit: 50
            }
        },
        indexes: [
            { name: 'conv_created_idx', fields: ['conversationId', 'createdAt'] },
            { 
                name: 'msg_unread_idx',
                fields: ['conversationId'],
                where: { readAt: null }
            },
            { fields: ['senderId'] },
            { fields: ['isRead'] },
            { fields: ['readAt'] },
            { fields: ['isActive'] },
            { fields: ['deletedAt'] }
        ],
        validate: {
            async validConversation() {
                const conversation = await sequelize.models.Conversation.findByPk(this.conversationId);
                if (!conversation) throw new Error('Invalid conversation');
            },
            async validSender() {
                const sender = await sequelize.models.User.findByPk(this.senderId);
                if (!sender) throw new Error('Invalid sender');
            }
        },
        hooks: {
            beforeCreate: async (message) => {
                // Set readAt to null for new messages
                message.readAt = null;
            },
            afterCreate: async (message) => {
                try {
                    // Update conversation's lastMessageAt
                    await sequelize.models.Conversation.update(
                        { lastMessageAt: message.createdAt },
                        { where: { id: message.conversationId } }
                    );

                    // Create notifications for other participants
                    const conversation = await sequelize.models.Conversation.findByPk(message.conversationId, {
                        include: [{
                            model: sequelize.models.User,
                            as: 'users',
                            attributes: ['id'],          // we only need the ids
                            through: { attributes: [] }, // skip join-table payload
                            where: {
                                id: { [Op.ne]: message.senderId }
                            }
                        }]
                    });

                    if (conversation?.users) {
                        await Promise.all(conversation.users.map(user =>
                            sequelize.models.Notification.create({
                                userId: user.id,
                                type: 'info',
                                category: 'message',
                                title: 'New Message',
                                message: `You have a new message in your conversation`,
                                metadata: {
                                    conversationId: conversation.id,
                                    messageId: message.id,
                                    senderId: message.senderId
                                }
                            })
                        ));
                    }
                } catch (error) {
                    console.error('Error in afterCreate hook for Message:', error);
                    // Don't throw the error to prevent message creation from failing
                }
            },
            beforeUpdate: async (message) => {
                // If message is being marked as read, set readAt timestamp
                if (message.changed('isRead') && message.isRead && !message.readAt) {
                    message.readAt = new Date();
                }
            }
        }
    });

    // Class Methods
    Message.findByConversation = function(conversationId) {
  return this
    .scope({ method: ['byConversation', conversationId] })
    .scope('recent')
    .findAll();
};

    Message.findUnreadByUser = function(userId) {
        return this.findAll({
            include: [
                {
                    model: sequelize.models.Conversation,
                    as: 'conversation',
                    include: [
                        {
                            model: sequelize.models.ConversationParticipant,
                            as: 'participants',
                            attributes: [],           // no payload needed
                            where: { userId }
                        }
                    ]
                }
            ],
            where: {
                senderId: { [Op.ne]: userId }, // don't count own messages
                readAt: null                   // still unread
            }
        });
    };

    // Instance Methods
    Message.prototype.markAsRead = async function() {
        if (!this.isRead) {
            this.isRead = true;
            this.readAt = new Date();
            await this.save();
        }
        return this;
    };

    Message.prototype.markAsUnread = async function() {
        if (this.isRead) {
            this.isRead = false;
            this.readAt = null;
            await this.save();
        }
        return this;
    };

    // Associations
    Message.associate = models => {
        Message.belongsTo(models.Conversation, {
            foreignKey: 'conversationId',
            as: 'conversation'
        });
        Message.belongsTo(models.User, {
            foreignKey: 'senderId',
            as: 'sender'
        });
    };

    return Message;
}; 