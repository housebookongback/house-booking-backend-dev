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
const { literal } = require('sequelize');

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

      // First, try to find an existing conversation ID
      const existingConversation = await Conversation.findOne({
        attributes: ['id'],
        include: [
          {
            model: ConversationParticipant,
            as: 'participants',
            attributes: [], // Don't select any participant columns
            where: {
              userId: { [Op.in]: [currentUserId, otherUserId] }
            }
          }
        ],
        group: ['Conversation.id'],
        having: literal('COUNT(DISTINCT "participants"."userId") = 2'),
        subQuery: false
      });

      let conversation;
      if (existingConversation) {
        // If found, load the full conversation details
        conversation = await Conversation.findByPk(existingConversation.id, {
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
            },
            {
              model: Listing,
              as: 'listing',
              attributes: ['id', 'title', 'description']
            }
          ]
        });
      } else {
        // Create new conversation
        conversation = await Conversation.create({
          listingId,
          title: listing.title
        });

        // Create participants
        await ConversationParticipant.bulkCreate([
          {
            conversationId: conversation.id,
            userId: currentUserId,
            role: 'guest'
          },
          {
            conversationId: conversation.id,
            userId: otherUserId,
            role: 'host'
          }
        ]);

        // Load the full conversation details for the new conversation
        conversation = await Conversation.findByPk(conversation.id, {
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
            },
            {
              model: Listing,
              as: 'listing',
              attributes: ['id', 'title', 'description']
            }
          ]
        });
      }

      // Notify the host via Socket.IO
      const conversationId = conversation.id;
      const roomId = `conversation:${conversationId}`;
      const hostId = listing.hostId;
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
        }
      }

      return res.json(conversation);
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
          },
          {
            model: Listing,
            as: 'listing',
            attributes: ['id', 'title', 'description']
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

          // Get the listing title
          const listingTitle = conv.listing ? conv.listing.title : 'No listing';
          
          // Get the other participant's name and role
          let participantName = 'Unknown';
          let participantRole = 'guest';
          
          if (otherParticipant) {
            // Find the participant's role
            const participant = conv.participants.find(p => p.user.id === otherParticipant.id);
            if (participant) {
              participantRole = participant.role;
            }
            
            // Use the actual name if available
            participantName = otherParticipant.name || participantRole;
          }

          // Create a title that includes both the listing and participant name
          const title = `${listingTitle} - ${participantName}`;

          // Log the conversation details for debugging
          console.log('Conversation details:', {
            id: conv.id,
            listingTitle,
            participantName,
            participantRole,
            otherParticipant: otherParticipant ? {
              id: otherParticipant.id,
              name: otherParticipant.name,
              email: otherParticipant.email,
              profilePicture: otherParticipant.profilePicture
            } : null,
            participants: conv.participants.map(p => ({
              id: p.user.id,
              name: p.user.name,
              role: p.role
            }))
          });

          return {
            ...conv.toJSON(),
            title,
            unreadCount,
            otherParticipant,
            lastMessage,
            listing: conv.listing ? {
              id: conv.listing.id,
              title: conv.listing.title,
              description: conv.listing.description
            } : null
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
