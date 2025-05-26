const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { authenticate } = require('../middleware/authMiddleware');
const { uploadMultiple } = require('../middleware/upload');

/**
 * Public Routes - No authentication required
 */

// GET / - Get all published listings with optional filters
// Query params: page, limit, sortBy, sortOrder, categoryId, locationId, minPrice, maxPrice, minRating, instantBookable
router.get('/', listingController.getAllListings);

/**
 * Property Type, Category, and Amenity Routes
 * These must come before /:listingId to avoid route conflicts
 */

// GET /property-types - Get all available property types
// Returns: Array of property types with id, name, and icon
router.get('/property-types', listingController.getPropertyTypes);
router.get('/categories', listingController.getCategories);
router.post('/draft', authenticate, listingController.createDraftListing);
// Add route for updating basic info
router.patch('/:listingId/basic-info', authenticate, listingController.updateBasicInfo);

// PATCH /:listingId/location - Update listing location (Step 2)
// Body: 
//   - address (string or object {street, city, country})
//   - coordinates (object with lat, lng)
//   - locationName (optional, helps with location record matching)
router.patch('/:listingId/location', authenticate, listingController.updateLocation);

// PATCH /:listingId/details - Update listing details (Step 3)
// Body: bedrooms, bathrooms, beds, accommodates
router.patch('/:listingId/details', authenticate, listingController.updateDetails);

// PATCH /:listingId/pricing - Update listing pricing (Step 4)
// Body: pricePerNight, cleaningFee, securityDeposit, minimumNights, maximumNights
router.patch('/:listingId/pricing', authenticate, listingController.updatePricing);

// PATCH /:listingId/photos - Upload listing photos (Step 5)
// Body: multipart/form-data with photos
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

// PATCH /:listingId/calendar - Update listing calendar (Step 7)
// Body: Array of calendar entries [{ date, isAvailable, price }]
router.patch('/:listingId/calendar', authenticate, listingController.updateCalendar);
router.get('/:listingId/calendar', listingController.getCalendar);

// Step Status Management
router.patch('/:listingId/step-status', authenticate, listingController.updateStepStatus);

// GET /:listingId/step-status - Get current listing step completion status
// Returns: Current step and completion status for all steps
router.get('/:listingId/step-status', authenticate, listingController.getStepStatus);

// PATCH /:listingId/publish - Publish a completed draft listing
// Changes status from 'draft' to 'published' if all steps are complete
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
router.get('/details/:listingId',listingController.getOneListing)

module.exports = router; 