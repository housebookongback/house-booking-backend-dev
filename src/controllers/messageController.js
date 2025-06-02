// controllers/messageController.js

// ─── 1) Import getMessageNamespace & getActiveUsers from your Socket.IO setup ───
// (They are exported by src/index.js, not by ../models)
const { getMessageNamespace, getActiveUsers } = require('../socket/index');
const {
  Message,
  Conversation,
  User,
  ConversationParticipant,
  Listing
} = require('../models');
const { Op } = require('sequelize');

// Initialize with a function to ensure we get the latest instance
const getMessageNamespaceInstance = () => {
  const namespace = getMessageNamespace();
  if (!namespace) {
    console.warn('Message namespace not yet initialized');
    return null;
  }
  return namespace;
};

const getActiveUsersInstance = () => {
  const users = getActiveUsers();
  if (!users) {
    console.warn('Active users map not yet initialized');
    return new Map();
  }
  return users;
};

const messageController = {
  // ─── Get or create conversation between two users ─────────────────────────────
  getOrCreateConversation: async (req, res) => {
    try {
      const { otherUserId, listingId } = req.body;
      const currentUserId = req.user.id;

      // Validate inputs
      if (!otherUserId || !listingId) {
        return res
          .status(400)
          .json({ message: 'otherUserId and listingId are required' });
      }

      // Check if listing exists and get host
      const listing = await Listing.findByPk(listingId);
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      // Prevent hosts from messaging themselves
      if (currentUserId === listing.hostId) {
        return res
          .status(400)
          .json({ message: 'Hosts cannot message themselves' });
      }

      // Verify the other user is the host
      if (otherUserId !== listing.hostId) {
        return res
          .status(400)
          .json({ message: 'Can only message the host of this listing' });
      }

      // Check if other user exists
      const otherUser = await User.findByPk(otherUserId);
      if (!otherUser) {
        return res.status(404).json({ message: 'Other user not found' });
      }

      // Find or create conversation
      // (Assuming findOrCreateBetweenUsers returns either [instance, created] or instance itself)
      let conversation = await Conversation.findOrCreateBetweenUsers(
        currentUserId,
        otherUserId,
        listingId
      );
      // If your helper returns an array: [conv, created], do:
      // const [conversation] = await Conversation.findOrCreateBetweenUsers(...);

      // ─── Notify the host via Socket.IO ────────────────────────────────────────
      const conversationId = conversation.id;
      const roomId = `conversation:${conversationId}`;
      const hostId = listing.hostId; // ← CHANGED: define hostId here
      const hostSocketId = getActiveUsersInstance().get(hostId);
      if (hostSocketId) {
        const messageNamespace = getMessageNamespaceInstance();
        if (messageNamespace) {
          messageNamespace.to(hostSocketId).emit('new_conversation_created', {
            conversationId,
            roomId,
            guestId: currentUserId,
            listingId
          });
        } else {
          console.warn('Socket namespace not available, message created but not broadcast');
        }
      }
      // ────────────────────────────────────────────────────────────────────────────

      // Get conversation with participants and last messages
      const conversationWithDetails = await Conversation.findByPk(conversationId, {
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
            include: [
              {
                model: User,
                as: 'sender',
                attributes: ['id', 'name', 'profilePicture']
              }
            ]
          }
        ]
      });

      return res.json(conversationWithDetails);
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      return res.status(500).json({ message: error.message });
    }
  },

  // ─── Get all conversations for current user ───────────────────────────────────
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
            include: [
              {
                model: User,
                as: 'sender',
                attributes: ['id', 'name', 'profilePicture']
              }
            ]
          },
          {
            model: ConversationParticipant,
            as: 'participants',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email', 'profilePicture']
              }
            ]
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

      return res.json(conversationsWithDetails);
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      return res.status(500).json({ message: error.message });
    }
  },

  // ─── Get messages for a conversation ────────────────────────────────────────
  getMessages: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      // Check if user is part of conversation
      const canAccess = await Conversation.findByPk(conversationId).then((conv) =>
        conv?.canAccess(userId)
      );

      if (!canAccess) {
        return res
          .status(403)
          .json({ message: 'Not authorized to access this conversation' });
      }

      const messages = await Message.findByConversation(conversationId);
      return res.json(messages);
    } catch (error) {
      console.error('Error in getMessages:', error);
      return res.status(500).json({ message: error.message });
    }
  },

  // ─── Send a message ─────────────────────────────────────────────────────────
  sendMessage: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { content, metadata } = req.body;
      const userId = req.user.id;

      // Validate content
      if (!content || content.trim().length === 0) {
        return res
          .status(400)
          .json({ message: 'Message content is required' });
      }

      // Check if user is part of conversation
      const canAccess = await Conversation.findByPk(conversationId).then((conv) =>
        conv?.canAccess(userId)
      );

      if (!canAccess) {
        return res
          .status(403)
          .json({
            message: 'Not authorized to send messages in this conversation'
          });
      }

      // 1) Create the message record
      const message = await Message.create({
        conversationId,
        senderId: userId,
        content,
        metadata
      });

      // 2) Fetch messageWithDetails (so we have sender info, etc.)
      const messageWithDetails = await Message.findByPk(message.id, {
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['id', 'name', 'profilePicture']
          }
        ]
      });

      // 3) Broadcast the new message via Socket.IO
      const namespace = getMessageNamespace();
      if (namespace) {
        const roomId = `conversation:${conversationId}`;
        // Comment out socket emission since we're using socket.io directly in messageSocket.js
        /*
        namespace.to(roomId).emit('new_message', {
          message: messageWithDetails,
          conversationId
        });
        */
      } else {
        console.warn('Socket namespace not available, message created but not broadcast');
      }

      return res.json(messageWithDetails);
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return res.status(500).json({ message: error.message });
    }
  },

  // ─── Mark messages as read ──────────────────────────────────────────────────
  markAsRead: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      // Check if user is part of conversation
      const canAccess = await Conversation.findByPk(conversationId).then((conv) =>
        conv?.canAccess(userId)
      );

      if (!canAccess) {
        return res
          .status(403)
          .json({ message: 'Not authorized to access this conversation' });
      }

      await Conversation.findByPk(conversationId).then((conv) =>
        conv?.markAsRead(userId)
      );

      return res.json({ success: true });
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return res.status(500).json({ message: error.message });
    }
  },

  // ─── Archive a conversation ─────────────────────────────────────────────────
  archiveConversation: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      // Check if user is part of conversation
      const canAccess = await Conversation.findByPk(conversationId).then((conv) =>
        conv?.canAccess(userId)
      );

      if (!canAccess) {
        return res
          .status(403)
          .json({ message: 'Not authorized to access this conversation' });
      }

      const conversation = await Conversation.findByPk(conversationId);
      await conversation.archive();

      return res.json({ success: true });
    } catch (error) {
      console.error('Error in archiveConversation:', error);
      return res.status(500).json({ message: error.message });
    }
  },

  // ─── Unarchive a conversation ───────────────────────────────────────────────
  unarchiveConversation: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      // Check if user is part of conversation
      const canAccess = await Conversation.findByPk(conversationId).then((conv) =>
        conv?.canAccess(userId)
      );

      if (!canAccess) {
        return res
          .status(403)
          .json({ message: 'Not authorized to access this conversation' });
      }

      const conversation = await Conversation.findByPk(conversationId);
      await conversation.unarchive();

      return res.json({ success: true });
    } catch (error) {
      console.error('Error in unarchiveConversation:', error);
      return res.status(500).json({ message: error.message });
    }
  },

  // ─── Block a conversation ───────────────────────────────────────────────────
  blockConversation: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      // Check if user is part of conversation
      const canAccess = await Conversation.findByPk(conversationId).then((conv) =>
        conv?.canAccess(userId)
      );

      if (!canAccess) {
        return res
          .status(403)
          .json({ message: 'Not authorized to access this conversation' });
      }

      const conversation = await Conversation.findByPk(conversationId);
      await conversation.block();

      return res.json({ success: true });
    } catch (error) {
      console.error('Error in blockConversation:', error);
      return res.status(500).json({ message: error.message });
    }
  }
};

module.exports = messageController;
