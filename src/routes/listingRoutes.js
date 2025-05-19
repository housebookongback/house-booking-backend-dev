const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { authenticate } = require('../middleware/authMiddleware');
const { uploadMultiple } = require('../middleware/upload');

// Step 1: Basic Information
router.get('/property-types', listingController.getPropertyTypes);
router.get('/categories', listingController.getCategories);
router.post('/draft', authenticate, listingController.createDraftListing);
// Add route for updating basic info
router.patch('/:listingId/basic-info', authenticate, listingController.updateBasicInfo);

// Step 2: Location
router.patch('/:listingId/location', authenticate, listingController.updateLocation);

// Step 3: Details
router.patch('/:listingId/details', authenticate, listingController.updateDetails);

// Step 4: Pricing
router.patch('/:listingId/pricing', authenticate, listingController.updatePricing);

// Step 5: Photos
router.patch('/:listingId/photos', authenticate, uploadMultiple, listingController.updatePhotos);

// Set a specific photo as featured/cover
router.put('/:listingId/photos/:photoId/feature', authenticate, listingController.setPhotoAsFeatured);

// Delete a specific photo
router.delete('/:listingId/photos/:photoId', authenticate, listingController.deletePhoto);

// Add new photos to an existing listing
router.post('/:listingId/photos', authenticate, uploadMultiple, listingController.addPhotos);

// Get all available amenities - Make this endpoint public
router.get('/amenities', listingController.getAmenities);

// Amenities Update
router.patch('/:listingId/amenities', authenticate, listingController.updateAmenities);
router.patch('/:listingId/amenities-simple', authenticate, listingController.updateAmenitiesSimple);

// Step 6: Rules
router.patch('/:listingId/rules', authenticate, listingController.updateRules);
router.patch('/:listingId/rules-simple', authenticate, listingController.updateRulesSimple);

// Step 7: Calendar
router.patch('/:listingId/calendar', authenticate, listingController.updateCalendar);
router.get('/:listingId/calendar', listingController.getCalendar);

// Step Status Management
router.patch('/:listingId/step-status', authenticate, listingController.updateStepStatus);
router.get('/:listingId/step-status', authenticate, listingController.getStepStatus);

// Final Step: Publish
router.patch('/:listingId/publish', authenticate, listingController.publishListing);

// Toggle listing status (activate/deactivate)
router.patch('/:listingId/toggle-status', authenticate, listingController.toggleListingStatus);

// Emergency path for force updating status when publish doesn't work
router.post('/:listingId/force-status-update', authenticate, listingController.forceUpdateStatus);

// Direct update endpoint for fallback
router.post('/:listingId/direct-update', authenticate, listingController.directUpdateListing);

// check availability for booking
router.get('/:listingId/availability',  listingController.getAvailability);

// get all listings
router.get('/', listingController.getAllListings);

// Utility route - schema check and fix (protect with admin auth later)
router.get('/admin/check-schema', listingController.checkAndFixSchema);

// get single listing by id
router.get('/:listingId', authenticate, listingController.getListingById);

// delete listing
router.delete('/:listingId', authenticate, listingController.deleteListing);

module.exports = router; 