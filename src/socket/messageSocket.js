// messageSocket.js

const { Op } = require('sequelize');
const { Message, Conversation, ConversationParticipant, User } = require('../models');

function messageSocket(io, activeUsers) {
  // Helper: automatically join all rooms this user belongs to
  async function joinAllRooms(userId, socket) {
    try {
      const conversations = await Conversation.getUserConversations(userId);
      conversations.forEach((conv) => {
        socket.join(`conversation:${conv.id}`);
      });
      console.log(`User ${userId} joined ${conversations.length} conversations`);
    } catch (error) {
      console.error('Error joining conversations:', error);
    }
  }

  io.on('connection', async (socket) => {
    console.log('DEBUG in messageSocket - Message Socket Connection:', {
      hasUser: !!socket.data.user,
      userData: socket.data.user,
      auth: socket.handshake.auth
    });

    const userId = socket.data.user.id;
    activeUsers.set(userId, socket.id);

    // 1) Immediately join all rooms for this user
    await joinAllRooms(userId, socket);

    // 2) Handle send_message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, metadata } = data;

        // ── STEP A ──: Make sure the Conversation row exists, and that BOTH host and guest are participants.
        //            We do this by fetching the Conversation plus its “users” through the pivot table.

        const conversation = await Conversation.findByPk(conversationId, {
          include: [{
            model: User,
            as: 'users',
            attributes: ['id'],       // we only need each user.id
            through: { attributes: [] } 
          }]
        });

        if (!conversation) {
          // No such conversation in the DB
          throw new Error('Invalid conversation: not found');
        }

        // Check if this socket’s userId is actually in `conversation.users`
        const participantIds = conversation.users.map(u => u.id);
        if (!participantIds.includes(userId)) {
          // The sender is not a participant
          throw new Error('Invalid conversation: user is not a participant');
        }

        // (Optionally) If you also want to ensure that there is at least one “other” participant:
        //    if (participantIds.length < 2) {
        //      throw new Error('Invalid conversation: missing guest or host participant');
        //    }

        // ── STEP B ──: Now that the DB says “yes, this conversation exists and the user is in it,” we can create the new message.
        const message = await Message.create({
          conversationId,
          senderId: userId,
          content,
          metadata
        });

        // ── STEP C ──: Broadcast to everyone in the room. Even if someone hasn’t yet joined() live, 
        //               future joiners will still see message history (because your front end typically 
        //               loads history via a REST call).
        io.to(`conversation:${conversationId}`).emit('new_message', {
          message,
          conversationId
        });
      }
      catch (error) {
        console.error('Error sending message:', error);
        // If it was a validation/“not found” error, relay it back to the client:
        socket.emit('error', { message: error.message || 'Failed to send message' });
      }
    });

    // 3) Handle mark_read exactly as before
    socket.on('mark_read', async (data) => {
      try {
        const { conversationId } = data;

        // (Optional) You could repeat the same “check conversation exists & participant” logic here,
        //           if you want to be 100% safe. Otherwise we just mark read.
        await ConversationParticipant.update(
          { lastReadAt: new Date() },
          { where: { conversationId, userId } }
        );
        await Message.update(
          { readAt: new Date() },
          {
            where: {
              conversationId,
              senderId: { [Op.ne]: userId },
              readAt: null
            }
          }
        );

        socket.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          userId
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Failed to mark messages as read' });
      }
    });

    // 4) Typing
    socket.on('typing', (data) => {
      const { conversationId, isTyping } = data;
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        isTyping
      });
    });

    // 5) Cleanup on disconnect
    socket.on('disconnect', () => {
      activeUsers.delete(userId);
    });
  });
}

module.exports = messageSocket;
