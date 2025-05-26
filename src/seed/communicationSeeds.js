const { faker } = require('@faker-js/faker');
const { Message, MessageAttachment, Conversation, ConversationParticipant } = require('../models');
const db = require('../models');

async function seedCommunication() {
  try {
    // Clean existing data
    await db.MessageAttachment.destroy({ where: {} });
    await db.Message.destroy({ where: {} });
    await db.ConversationParticipant.destroy({ where: {} });
    await db.Conversation.destroy({ where: {} });
    await db.Notification.destroy({ where: {} });

    // Get existing users and listings
    const users = await db.User.findAll();
    const listings = await db.Listing.scope('all').findAll({ raw: true });

    if (!users.length) {
      throw new Error('No users found. Please seed users first.');
    }

    if (!listings.length) {
      throw new Error('No listings found. Please seed listings first.');
    }

    // Create sample conversations
    const conversations = await Conversation.bulkCreate([
      {
        type: 'booking',
        status: 'active',
        lastMessageAt: new Date('2024-03-01'),
        metadata: {
          bookingId: 1
        }
      }
    ]);

    // Create conversation participants
    await ConversationParticipant.bulkCreate([
      {
        conversationId: conversations[0].id,
        userId: 2, // Host user
        role: 'host',
        status: 'active',
        lastReadAt: new Date('2024-03-01')
      },
      {
        conversationId: conversations[0].id,
        userId: 3, // Guest user
        role: 'guest',
        status: 'active',
        lastReadAt: new Date('2024-03-01')
      }
    ]);

    // Create messages
    const messages = await Message.bulkCreate([
      {
        conversationId: conversations[0].id,
        senderId: 3, // Guest
        content: 'Hi, I\'m interested in booking your property.',
        type: 'text',
        status: 'delivered',
        sentAt: new Date('2024-03-01T10:00:00')
      },
      {
        conversationId: conversations[0].id,
        senderId: 2, // Host
        content: 'Hello! Yes, the property is available for your dates.',
        type: 'text',
        status: 'delivered',
        sentAt: new Date('2024-03-01T10:05:00')
      }
    ]);

    // Create message attachments
    await MessageAttachment.bulkCreate([
      {
        messageId: messages[0].id,
        type: 'image',
        url: 'https://example.com/image1.jpg',
        filename: 'image1.jpg',
        size: 1024,
        mimeType: 'image/jpeg'
      }
    ]);

    console.log('✅ Communication models seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding communication models:', error);
    throw error;
  }
}

module.exports = seedCommunication;