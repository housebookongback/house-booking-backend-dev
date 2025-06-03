// src/models/conversationParticipant.js
const { Op, literal } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const ConversationParticipant = sequelize.define(
    'ConversationParticipant',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      conversationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Conversations', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      role: {
        type: DataTypes.ENUM('guest', 'host'),
        allowNull: false,
      },
      lastReadAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'ConversationParticipants',
      timestamps: true,
      paranoid: true,
      defaultScope: { where: { isActive: true } },
      scopes: {
        all: { where: {} },
        active: { where: { isActive: true } },
        inactive: { where: { isActive: false } },
        withUnread: {
          where: {
            lastReadAt: {
              [Op.lt]: literal(`(
                SELECT MAX("createdAt")
                FROM "Messages"
                WHERE "conversationId" = "ConversationParticipant"."conversationId"
              )`),
            },
          },
        },
      },
      indexes: [
        { fields: ['conversationId'] },
        { fields: ['userId'] },
        { fields: ['role'] },
        { fields: ['lastReadAt'] },
        { fields: ['isActive'] },
        { fields: ['deletedAt'] },
        {
          unique: true,
          fields: ['conversationId', 'userId'],
          name: 'conversation_participant_unique_idx',
        },
        {
          name: 'user_lastread_idx',
          fields: ['userId', 'lastReadAt'],
        },
      ],
      validate: {
        async validConversation() {
          const conv = await sequelize.models.Conversation.findByPk(this.conversationId);
          if (!conv) throw new Error('Invalid conversation: Conversation does not exist');
        },
        async validUser() {
          const user = await sequelize.models.User.findByPk(this.userId);
          if (!user) throw new Error('Invalid user: User does not exist');
        },
        async validRole() {
          if (this.role === 'host') {
            const conv = await sequelize.models.Conversation.findByPk(this.conversationId, {
              include: [
                // <-- use sequelize.models.Listing here, because associate() attached it as "Listing"
                { model: sequelize.models.Listing, as: 'listing', attributes: ['hostId'] },
              ],
            });
            if (conv?.listing?.hostId !== this.userId) {
              throw new Error('Invalid host role: User must be the owner of the listing');
            }
          }
        },
      },
      hooks: {
        afterCreate: async (participant) => {
          const participantCount = await ConversationParticipant.count({
            where: { conversationId: participant.conversationId },
          });
          if (participantCount === 1) {
            await sequelize.models.Conversation.update(
              { lastMessageAt: new Date() },
              { where: { id: participant.conversationId } }
            );
          }
        },
        beforeValidate: async (participant) => {
          if (participant.role === 'host') {
            const conv = await sequelize.models.Conversation.findByPk(participant.conversationId, {
              include: [
                // <-- likewise, use sequelize.models.Listing here
                { model: sequelize.models.Listing, as: 'listing', attributes: ['hostId'] },
              ],
            });
            if (conv?.listing?.hostId !== participant.userId) {
              throw new Error('Invalid host role: User must be the owner of the listing');
            }
          }
        },
      },
    }
  );

  // Class Methods
  ConversationParticipant.findOrCreateForConversation = async function (conversationId, userId, role) {
    const [participant] = await this.findOrCreate({
      where: { conversationId, userId },
      defaults: { role },
    });
    return participant;
  };

  // Instance Methods
  ConversationParticipant.prototype.markAsRead = function () {
    return this.update({ lastReadAt: new Date() });
  };

  ConversationParticipant.prototype.getUnreadCount = async function () {
    return sequelize.models.Message.count({
      where: {
        conversationId: this.conversationId,
        senderId: { [Op.ne]: this.userId },
        createdAt: {
          [Op.gt]: this.lastReadAt || new Date(0),
        },
      },
    });
  };

  // Associations
  ConversationParticipant.associate = (models) => {
    ConversationParticipant.belongsTo(models.Conversation, {
      foreignKey: 'conversationId',
      as: 'conversation',
    });
    ConversationParticipant.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return ConversationParticipant;
};
