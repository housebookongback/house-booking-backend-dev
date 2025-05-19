const express = require('express');
const router = express.Router();
const hostApplicationController = require('../controllers/hostApplicationController');

// POST /api/host/application
router.post('/application', hostApplicationController.submitApplication);

module.exports = router; 