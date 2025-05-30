const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { authenticate } = require('../middleware/authMiddleware');

/**
 * Debug Routes - for troubleshooting only
 * These routes provide detailed information helpful for debugging the application
 */

// Debug calendar data for a specific listing
router.get('/listings/:listingId/calendar', listingController.debugCalendar);

// Add more debug routes as needed

module.exports = router; 