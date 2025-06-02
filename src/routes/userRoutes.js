const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const { uploadMultiple } = require('../middleware/upload');

// Profile routes - all protected by JWT authentication
router.patch('/profile', authenticateJWT, uploadMultiple, userController.updateProfile);
router.delete('/account', authenticateJWT, userController.deleteAccount);

// Host application routes
router.get('/host-application', authenticateJWT, userController.getHostApplicationStatus);
router.post('/host-application', authenticateJWT, uploadMultiple, userController.applyForHosting);

module.exports = router; 