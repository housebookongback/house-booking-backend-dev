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
      console.log(`User ${userId} joined ${conversations.length} existing rooms`);
    } catch (error) {
      console.error('Error joining conversations:', error);
    }
  }

  io.on('connection', async (socket) => {
    console.log('DEBUG in messageSocket - New connection:', {
      hasUser: !!socket.data.user,
      userData: socket.data.user,
      auth: socket.handshake.auth
    });

    const userId = socket.data.user.id;
    activeUsers.set(userId, socket.id);

    // ── 1) Automatically join any pre-existing conversations in the DB
    await joinAllRooms(userId, socket);

    // ── 2) New addition: handle explicit "join_room" from client (guest or host)
    //     so that when a REST route creates a new conversation, the host can do:
    //       socket.emit('join_room', { roomId: 'conversation:123' });
    //     and the server will put them into that room immediately.
    socket.on('join_room', ({ roomId }) => {
      socket.join(roomId);
      // Log exactly which rooms this socket is in now:
      console.log(`Socket ${socket.id} (user ${userId}) joined room ${roomId}. Rooms:`, Array.from(socket.rooms));
      // Send back confirmation so the client knows join succeeded
      socket.emit('joined_confirmation', { roomId });
    });

    // ── 3) "send_message" stays exactly as before
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, metadata } = data;

        const conversation = await Conversation.findByPk(conversationId, {
          include: [{
            model: User,
            as: 'users',
            attributes: ['id'],
            through: { attributes: [] }
          }]
        });

        if (!conversation) {
          throw new Error('Invalid conversation: not found');
        }
        const participantIds = conversation.users.map(u => u.id);
        if (!participantIds.includes(userId)) {
          throw new Error('Invalid conversation: user is not a participant');
        }

        const message = await Message.create({
          conversationId,
          senderId: userId,
          content,
          metadata
        });

        socket.broadcast.to(`conversation:${conversationId}`).emit('new_message', {
          message,
          conversationId
        });
      }
      catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: error.message || 'Failed to send message' });
      }
    });

    // ── 4) mark_read (unchanged) ─────────────────────────────────────────────────
    socket.on('mark_read', async (data) => {
      // … your existing mark_read logic …
    });

    // ── 5) typing (unchanged) ───────────────────────────────────────────────────
    socket.on('typing', (data) => {
      // … your existing typing logic …
    });

    // ── 6) Cleanup on disconnect ─────────────────────────────────────────────────
    socket.on('disconnect', () => {
      activeUsers.delete(userId);
    });
  });
}

module.exports = messageSocket;
