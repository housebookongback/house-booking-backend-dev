const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { verifyAdmin } = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

// Host verification management routes
router.get('/host-verifications', authenticate, verifyAdmin, adminController.listHostVerifications);
router.get('/host-verifications/pending', authenticate, verifyAdmin, adminController.listPendingVerifications);
router.get('/host-verifications/:id', authenticate, verifyAdmin, adminController.getVerificationDetails);
router.post('/host-verifications/:id/approve', authenticate, verifyAdmin, adminController.approveVerification);
router.post('/host-verifications/:id/reject', authenticate, verifyAdmin, adminController.rejectVerification);

// Host management routes
router.get('/hosts', authenticate, verifyAdmin, adminController.listHosts);
router.get('/hosts/:id', authenticate, verifyAdmin, adminController.getHostDetails);
router.put('/hosts/:id/verification-status', authenticate, verifyAdmin, adminController.updateHostVerificationStatus);

// User management routes
router.get('/users', authenticate, verifyAdmin, adminController.listUsers);
router.get('/users/:id', authenticate, verifyAdmin, adminController.getUserDetails);
router.post('/users/:id/ban', authenticate, verifyAdmin, adminController.banUser);
router.post('/users/:id/unban', authenticate, verifyAdmin, adminController.unbanUser);
router.post('/users/bulk-ban', authenticate, verifyAdmin, adminController.bulkBanUsers);
router.post('/users/bulk-unban', authenticate, verifyAdmin, adminController.bulkUnbanUsers);

module.exports = router; 