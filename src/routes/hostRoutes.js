const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const verifyHost = require('../middleware/hostMiddleware');
const hostController = require('../controllers/hostController');

// Host registration (only needs authentication)
router.post('/register', authenticate, hostController.register);

// Host profile management (needs host verification)
router.get('/profile', authenticate, verifyHost, hostController.getProfile);
router.put('/profile', authenticate, verifyHost, hostController.updateProfile);

// Host verification (only needs authentication)
router.post('/verify', authenticate, hostController.submitVerification);
router.get('/verification-status', authenticate, hostController.getVerificationStatus);

// Notification preferences (needs host verification)
router.put('/notifications', authenticate, verifyHost, hostController.updateNotificationPreferences);

module.exports = router;
