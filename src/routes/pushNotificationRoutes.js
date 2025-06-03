const express = require('express');
const router = express.Router();
const pushNotificationController = require('../controllers/pushNotificationController');
const { authenticate } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Subscribe to push notifications
router.post('/subscribe', pushNotificationController.subscribe);

// Unsubscribe from push notifications
router.post('/unsubscribe', pushNotificationController.unsubscribe);

// Update notification preferences
router.put('/preferences', pushNotificationController.updatePreferences);

// Test push notification
router.post('/test', pushNotificationController.testNotification);

module.exports = router; 