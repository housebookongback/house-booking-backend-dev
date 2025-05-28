const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { authenticate } = require('../middleware/authMiddleware');
const { uploadMultiple } = require('../middleware/upload');

/**
 * Public Routes - No authentication required
 */

// GET /public - Get all published listings with optional filters for public viewing (no auth required)
// Query params: page, limit, sortBy, sortOrder, categoryId, locationId, minPrice, maxPrice, minRating, instantBookable
router.get('/public', listingController.getAllListings);

// GET /:listingId - Get single listing by id (public access)
router.get('/:listingId/public', listingController.getListingById);

// GET /property-types - Get all available property types (public access)
router.get('/property-types', listingController.getPropertyTypes);

// GET /categories - Get all categories (public access)
router.get('/categories', listingController.getCategories);

// GET /amenities - Get all available amenities (public access)
router.get('/amenities', listingController.getAmenities);

// GET /:listingId/availability - Check availability for booking (public access)
router.get('/:listingId/availability', listingController.getAvailability);

// GET /:listingId/calendar - Get listing calendar (public access)
router.get('/:listingId/calendar', listingController.getCalendar);

/**
 * Protected Routes - Authentication required
 */

// GET / - Get all listings with host filtering when host=true (requires authentication)
// Query params: page, limit, sortBy, sortOrder, categoryId, locationId, minPrice, maxPrice, minRating, instantBookable, host
// Note: host=true parameter requires authentication and will filter to show only the host's listings
router.get('/', authenticate, listingController.getAllListings);

// GET /:listingId - Get single listing by id (with auth)
router.get('/:listingId', authenticate, listingController.getListingById);

// POST /draft - Create draft listing
router.post('/draft', authenticate, listingController.createDraftListing);

// PATCH /:listingId/basic-info - Update basic info
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

// Amenities Update
router.patch('/:listingId/amenities', authenticate, listingController.updateAmenities);
router.patch('/:listingId/amenities-simple', authenticate, listingController.updateAmenitiesSimple);

// Step 6: Rules
router.patch('/:listingId/rules', authenticate, listingController.updateRules);
router.patch('/:listingId/rules-simple', authenticate, listingController.updateRulesSimple);

// PATCH /:listingId/calendar - Update listing calendar (Step 7)
// Body: Array of calendar entries [{ date, isAvailable, price }]
router.patch('/:listingId/calendar', authenticate, listingController.updateCalendar);

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

// Utility route - schema check and fix (protect with admin auth later)
router.get('/admin/check-schema', listingController.checkAndFixSchema);

// delete listing
router.delete('/:listingId', authenticate, listingController.deleteListing);
router.get('/details/:listingId',listingController.getOneListing)

module.exports = router; 