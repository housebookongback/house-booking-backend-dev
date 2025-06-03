const express = require('express');
const router = express.Router();
const hostApplicationController = require('../controllers/hostApplicationController');
const { authenticate } = require('../middleware/authMiddleware');

// POST /api/host/application - Submit host application
router.post(
  '/application',
  authenticate,
  hostApplicationController.uploadFiles,
  hostApplicationController.submitApplication
);

// GET /api/host/application/status - Check host application status
router.get(
  '/application/status',
  authenticate,
  hostApplicationController.getApplicationStatus
);

module.exports = router; 