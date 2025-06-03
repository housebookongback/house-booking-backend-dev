const { faker } = require('@faker-js/faker');
const db= require('../models')

async function seedCommunicationModels() {
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

    // Seed Conversations
    const conversations = Array.from({ length: 10 }).map(() => {
      const listing = faker.helpers.arrayElement(listings);
      return {
        listingId: listing.id,
        title: `Conversation about ${listing.title}`,
        lastMessageAt: faker.date.past(),
        isActive: true,
        status: faker.helpers.arrayElement(['active', 'archived', 'blocked']),
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

    const createdConversations = await db.Conversation.bulkCreate(conversations);

    // Seed ConversationParticipants
    const conversationParticipants = createdConversations.flatMap(conv => {
      const host = faker.helpers.arrayElement(users);
      const guest = faker.helpers.arrayElement(users.filter(u => u.id !== host.id));
      
      return [
        {
          conversationId: conv.id,
          userId: host.id,
          role: 'host',
          lastReadAt: faker.date.past(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          conversationId: conv.id,
          userId: guest.id,
          role: 'guest',
          lastReadAt: faker.date.past(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    });

    await db.ConversationParticipant.bulkCreate(conversationParticipants);

    // Seed Messages
    const messages = createdConversations.flatMap(conv => {
      const participants = conversationParticipants.filter(p => p.conversationId === conv.id);
      return Array.from({ length: faker.number.int({ min: 3, max: 10 }) }).map(() => ({
        conversationId: conv.id,
        senderId: faker.helpers.arrayElement(participants).userId,
        content: faker.lorem.paragraph(),
        isRead: faker.datatype.boolean(),
        readAt: faker.date.past(),
        metadata: {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
    });

    const createdMessages = await db.Message.bulkCreate(messages);

    // Seed MessageAttachments
    const messageAttachments = createdMessages
      .filter(() => faker.datatype.boolean()) // Only some messages have attachments
      .map(message => {
        const isImage = faker.datatype.boolean();
        const fileType = isImage 
          ? faker.helpers.arrayElement(['image/jpeg', 'image/png', 'image/gif'])
          : faker.helpers.arrayElement(['application/pdf', 'application/msword']);
        
        return {
          messageId: message.id,
          uploaderId: message.senderId,
          fileName: `file_${faker.string.alphanumeric(8)}.${fileType.split('/')[1]}`,
          fileType,
          fileSize: faker.number.int({ min: 1000, max: 10000000 }),
          filePath: faker.system.filePath(),
          thumbnailPath: isImage ? faker.system.filePath() : null,
          width: isImage ? faker.number.int({ min: 100, max: 2000 }) : null,
          height: isImage ? faker.number.int({ min: 100, max: 2000 }) : null,
          duration: null,
          metadata: {},
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

    await db.MessageAttachment.bulkCreate(messageAttachments);

    // Seed Notifications
    const notifications = Array.from({ length: 20 }).map(() => ({
      userId: faker.helpers.arrayElement(users).id,
      type: faker.helpers.arrayElement(['info', 'success', 'warning', 'error']),
      category: faker.helpers.arrayElement(['booking', 'payment', 'review', 'message', 'system']),
      title: faker.lorem.sentence(),
      message: faker.lorem.paragraph(),
      isRead: faker.datatype.boolean(),
      readAt: faker.date.past(),
      metadata: {},
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await db.Notification.bulkCreate(notifications);

    console.log('Communication models seeded successfully');
  } catch (error) {
    console.error('Error seeding communication models:', error);
    throw error;
  }
}
// seedCommunicationModels()
module.exports = seedCommunicationModels;