const { Message, Conversation, User, ConversationParticipant, Listing } = require('../models');
const { Op } = require('sequelize');

const messageController = {
    // Get or create conversation between two users
    getOrCreateConversation: async (req, res) => {
        try {
            const { otherUserId, listingId } = req.body;
            const currentUserId = req.user.id;

            // Validate otherUserId
            if (!otherUserId) {
                return res.status(400).json({ message: 'otherUserId is required' });
            }

            // Check if other user exists
            const otherUser = await User.findByPk(otherUserId);
            if (!otherUser) {
                return res.status(404).json({ message: 'Other user not found' });
            }

            // Find or create conversation
            const conversation = await Conversation.findOrCreateBetweenUsers(
                currentUserId,
                otherUserId,
                listingId
            );

            // Get conversation with participants and last message
            const conversationWithDetails = await Conversation.findByPk(conversation.id, {
                include: [
                    {
                        model: User,
                        as: 'users',
                        attributes: ['id', 'name', 'email', 'profilePicture']
                    },
                    {
                        model: Message,
                        as: 'messages',
                        limit: 20,
                        order: [['createdAt', 'DESC']],
                        include: [{
                            model: User,
                            as: 'sender',
                            attributes: ['id', 'name', 'profilePicture']
                        }]
                    }
                ]
            });

            res.json(conversationWithDetails);
        } catch (error) {
            console.error('Error in getOrCreateConversation:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Get all conversations for current user
    getUserConversations: async (req, res) => {
        try {
            const conversations = await Conversation.getUserConversations(req.user.id, {
                include: [
                    {
                        model: User,
                        as: 'users',
                        attributes: ['id', 'name', 'email', 'profilePicture']
                    },
                    {
                        model: Message,
                        as: 'messages',
                        limit: 1,
                        order: [['createdAt', 'DESC']],
                        include: [{
                            model: User,
                            as: 'sender',
                            attributes: ['id', 'name', 'profilePicture']
                        }]
                    },
                    {
                        model: ConversationParticipant,
                        as: 'participants',
                        include: [{
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name', 'email', 'profilePicture']
                        }]
                    }
                ],
                order: [['lastMessageAt', 'DESC']]
            });

            // Add unread count and other participant info for each conversation
            const conversationsWithDetails = await Promise.all(
                conversations.map(async (conv) => {
                    const unreadCount = await conv.getUnreadCount(req.user.id);
                    const otherParticipant = await conv.getOtherParticipant(req.user.id);
                    const lastMessage = conv.messages[0] || null;

                    return {
                        ...conv.toJSON(),
                        unreadCount,
                        otherParticipant,
                        lastMessage
                    };
                })
            );

            res.json(conversationsWithDetails);
        } catch (error) {
            console.error('Error in getUserConversations:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Get messages for a conversation
    getMessages: async (req, res) => {
        try {
            const { conversationId } = req.params;
            const userId = req.user.id;

            // Check if user is part of conversation
            const canAccess = await Conversation.findByPk(conversationId)
                .then(conv => conv?.canAccess(userId));

            if (!canAccess) {
                return res.status(403).json({ message: 'Not authorized to access this conversation' });
            }

            const messages = await Message.findByConversation(conversationId);
            res.json(messages);
        } catch (error) {
            console.error('Error in getMessages:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Send a message
    sendMessage: async (req, res) => {
        try {
            const { conversationId } = req.params;
            const { content, metadata } = req.body;
            const userId = req.user.id;

            // Validate content
            if (!content || content.trim().length === 0) {
                return res.status(400).json({ message: 'Message content is required' });
            }

            // Check if user is part of conversation
            const canAccess = await Conversation.findByPk(conversationId)
                .then(conv => conv?.canAccess(userId));

            if (!canAccess) {
                return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
            }

            const message = await Message.create({
                conversationId,
                senderId: userId,
                content,
                metadata
            });

            // Get message with sender details
            const messageWithDetails = await Message.findByPk(message.id, {
                include: [{
                    model: User,
                    as: 'sender',
                    attributes: ['id', 'name', 'profilePicture']
                }]
            });

            res.json(messageWithDetails);
        } catch (error) {
            console.error('Error in sendMessage:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Mark messages as read
    markAsRead: async (req, res) => {
        try {
            const { conversationId } = req.params;
            const userId = req.user.id;

            // Check if user is part of conversation
            const canAccess = await Conversation.findByPk(conversationId)
                .then(conv => conv?.canAccess(userId));

            if (!canAccess) {
                return res.status(403).json({ message: 'Not authorized to access this conversation' });
            }

            await Conversation.findByPk(conversationId)
                .then(conv => conv?.markAsRead(userId));

            res.json({ success: true });
        } catch (error) {
            console.error('Error in markAsRead:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Archive a conversation
    archiveConversation: async (req, res) => {
        try {
            const { conversationId } = req.params;
            const userId = req.user.id;

            // Check if user is part of conversation
            const canAccess = await Conversation.findByPk(conversationId)
                .then(conv => conv?.canAccess(userId));

            if (!canAccess) {
                return res.status(403).json({ message: 'Not authorized to access this conversation' });
            }

            const conversation = await Conversation.findByPk(conversationId);
            await conversation.archive();

            res.json({ success: true });
        } catch (error) {
            console.error('Error in archiveConversation:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Unarchive a conversation
    unarchiveConversation: async (req, res) => {
        try {
            const { conversationId } = req.params;
            const userId = req.user.id;

            // Check if user is part of conversation
            const canAccess = await Conversation.findByPk(conversationId)
                .then(conv => conv?.canAccess(userId));

            if (!canAccess) {
                return res.status(403).json({ message: 'Not authorized to access this conversation' });
            }

            const conversation = await Conversation.findByPk(conversationId);
            await conversation.unarchive();

            res.json({ success: true });
        } catch (error) {
            console.error('Error in unarchiveConversation:', error);
            res.status(500).json({ message: error.message });
        }
    },

    // Block a conversation
    blockConversation: async (req, res) => {
        try {
            const { conversationId } = req.params;
            const userId = req.user.id;

            // Check if user is part of conversation
            const canAccess = await Conversation.findByPk(conversationId)
                .then(conv => conv?.canAccess(userId));

            if (!canAccess) {
                return res.status(403).json({ message: 'Not authorized to access this conversation' });
            }

            const conversation = await Conversation.findByPk(conversationId);
            await conversation.block();

            res.json({ success: true });
        } catch (error) {
            console.error('Error in blockConversation:', error);
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = messageController; 