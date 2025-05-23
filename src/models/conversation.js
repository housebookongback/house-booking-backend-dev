// src/models/conversation.js
const { Op, literal, fn } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define('Conversation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    listingId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Listings', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Optional conversation title',
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'archived', 'blocked'),
      allowNull: false,
      defaultValue: 'active',
    }
  }, {
    tableName: 'Conversations',
    timestamps: true,
    paranoid: true,
    defaultScope: {
      where: { 
        isActive: true,
        status: 'active',
      }
    },
    scopes: {
      all: { where: {} },
      archived: { where: { status: 'archived' } },
      blocked: { where: { status: 'blocked' } },
      withListing: (listingId) => ({ where: { listingId } })
    },
    indexes: [
      { fields: ['listingId'] },
      { fields: ['lastMessageAt'] },
      { fields: ['status'] },
      { fields: ['isActive'] },
      { fields: ['deletedAt'] },
      { 
        fields: ['listingId','status','isActive'],
        name: 'conversation_listing_status_active_idx'
      }
    ],
    validate: {
      async validParticipants() {
        const participants = await this.getParticipants();
        if (participants.length !== 2) {
          throw new Error('Conversation must have exactly 2 participants');
        }
      },
      async notBlocked() {
        if (this.status === 'blocked') {
          throw new Error('Cannot perform actions on a blocked conversation');
        }
      }
    },
    hooks: {
      afterCreate: async (conversation) => {
        conversation.lastMessageAt = new Date();
        await conversation.save();
      }
    }
  });

  // Class Methods
  Conversation.findOrCreateBetweenUsers = async function(userId1, userId2, listingId = null) {
    const existing = await this.scope('betweenUsers', userId1, userId2).findOne();
    if (existing) return existing;

    // otherwise create new
    const conv = await this.create({
      listingId,
      title: listingId
        ? null
        : `Conversation between ${userId1} & ${userId2}`
    });

    await sequelize.models.ConversationParticipant.bulkCreate([
      { conversationId: conv.id, userId: userId1 },
      { conversationId: conv.id, userId: userId2 }
    ]);

    return conv;
  };

  Conversation.getUserConversations = async function(userId, options = {}) {
    return this.findAll({
      include: [{
        model: sequelize.models.ConversationParticipant,
        as: 'participants',
        where: { userId },
        include: [{ model: sequelize.models.User, as: 'user' }],
        attributes: []
      }],
      order: [['lastMessageAt', 'DESC']],
      ...options
    });
  };

  // Instance Methods
  Conversation.prototype.archive = function() {
    return this.update({ status: 'archived' });
  };

  Conversation.prototype.unarchive = function() {
    return this.update({ status: 'active' });
  };

  Conversation.prototype.block = function() {
    return this.update({ status: 'blocked' });
  };

  Conversation.prototype.updateLastMessage = function() {
    return this.update({ lastMessageAt: new Date() });
  };

  Conversation.prototype.getOtherParticipant = async function(userId) {
    const part = await sequelize.models.ConversationParticipant.findOne({
      where: { conversationId: this.id, userId: { [Op.ne]: userId } },
      include: [{ model: sequelize.models.User, as: 'user' }]
    });
    return part?.user;
  };

  Conversation.prototype.getUnreadCount = async function(userId) {
    const result = await sequelize.models.Message.count({
      where: {
        conversationId: this.id,
        senderId: { [Op.ne]: userId },
        readAt: null
      }
    });
    return result;
  };

  Conversation.prototype.markAsRead = async function(userId) {
    return sequelize.models.Message.update(
      { readAt: new Date() },
      {
        where: {
          conversationId: this.id,
          senderId: { [Op.ne]: userId },
          readAt: null
        }
      }
    );
  };

  Conversation.prototype.canAccess = async function(userId) {
    if (this.status === 'blocked') return false;

    const participant = await sequelize.models.ConversationParticipant.findOne({
      where: { conversationId: this.id, userId }
    });

    return !!participant;
  };

  Conversation.prototype.getParticipantsWithRoles = async function() {
    return sequelize.models.ConversationParticipant.findAll({
      where: { conversationId: this.id },
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      attributes: ['role']
    });
  };

  // Associations
  Conversation.associate = (models) => {
    Conversation.belongsTo(models.Listing, { foreignKey: 'listingId', as: 'listing' });
    Conversation.hasMany(models.ConversationParticipant, { foreignKey: 'conversationId', as: 'participants' });
    Conversation.hasMany(models.Message, { foreignKey: 'conversationId', as: 'messages' });
  };

  return Conversation;
};
