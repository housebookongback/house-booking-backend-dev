const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const messageController = require('../controllers/messageController');

// Apply authentication middleware to all routes
router.use(authenticate);

// Conversation routes
router.post('/conversations', messageController.getOrCreateConversation);
router.get('/conversations', messageController.getUserConversations);

// Message routes for a specific conversation
router.get('/conversations/:conversationId/messages', messageController.getMessages);
router.post('/conversations/:conversationId/messages', messageController.sendMessage);
router.patch('/conversations/:conversationId/read', messageController.markAsRead);

// Conversation management routes
router.post('/conversations/:conversationId/archive', messageController.archiveConversation);
router.post('/conversations/:conversationId/unarchive', messageController.unarchiveConversation);
router.post('/conversations/:conversationId/block', messageController.blockConversation);

module.exports = router; 