const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { authenticate } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/upload');

// Step 1: Basic Information
router.get('/property-types', listingController.getPropertyTypes);
router.post('/draft', authenticate, listingController.createDraftListing);

// Step 2: Location
router.patch('/:listingId/location', authenticate, listingController.updateLocation);

// Step 3: Details
router.patch('/:listingId/details', authenticate, listingController.updateDetails);

// Step 4: Pricing
router.patch('/:listingId/pricing', authenticate, listingController.updatePricing);

// Step 5: Photos
router.patch('/:listingId/photos', authenticate, uploadSingle, listingController.updatePhotos);

// Step 6: Rules
router.patch('/:listingId/rules', authenticate, listingController.updateRules);

// Step 7: Calendar
router.patch('/:listingId/calendar', authenticate, listingController.updateCalendar);

// Step Status Management
router.patch('/:listingId/step-status', authenticate, listingController.updateStepStatus);
router.get('/:listingId/step-status', authenticate, listingController.getStepStatus);

// Final Step: Publish
router.patch('/:listingId/publish', authenticate, listingController.publishListing);

// check availability for booking
router.get('/:listingId/availability',  listingController.getAvailability);

// get all listings
router.get('/', listingController.getAllListings);

module.exports = router; 