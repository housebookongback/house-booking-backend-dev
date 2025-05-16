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

// GET /categories - Get all available categories
// Returns: Array of category objects with id, name, and description
router.get('/categories', listingController.getCategories);

// GET /amenities - Get all available amenities
// Returns: Array of amenity objects with id, name, description, and icon
router.get('/amenities', listingController.getAmenities);

// GET /:listingId - Get detailed information about a specific listing
// Returns: Full listing details including photos, amenities, host info, rules, etc.
router.get('/:listingId', listingController.getSingleListing);

// GET /:listingId/availability - Check listing availability for specific dates
// Query params: startDate, endDate, numberOfGuests
router.get('/:listingId/availability', listingController.getAvailability);

/**
 * Protected Routes - Listing Creation Flow
 * Requires authentication (valid JWT token)
 */

// POST /draft - Create a new draft listing
// Body: title, description, propertyTypeId
router.post('/draft', authenticate, listingController.createDraftListing);

// PATCH /:listingId/location - Update listing location (Step 2)
// Body: address, coordinates (lat, lng)
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

// PATCH /:listingId/rules - Update listing rules (Step 6)
// Body: Array of rules [{ title, description, isRequired }]
router.patch('/:listingId/rules', authenticate, listingController.updateRules);

// PATCH /:listingId/calendar - Update listing calendar (Step 7)
// Body: Array of calendar entries [{ date, isAvailable, price }]
router.patch('/:listingId/calendar', authenticate, listingController.updateCalendar);

/**
 * Protected Routes - Listing Management
 * Requires authentication (valid JWT token)
 */

// PATCH /:listingId/step-status - Update listing step completion status
// Body: { step, stepStatus }
router.patch('/:listingId/step-status', authenticate, listingController.updateStepStatus);

// GET /:listingId/step-status - Get current listing step completion status
// Returns: Current step and completion status for all steps
router.get('/:listingId/step-status', authenticate, listingController.getStepStatus);

// PATCH /:listingId/publish - Publish a completed draft listing
// Changes status from 'draft' to 'published' if all steps are complete
router.patch('/:listingId/publish', authenticate, listingController.publishListing);

// PATCH /:listingId/status - Toggle listing active/inactive status
// Body: { status: 'active' | 'inactive' }
router.patch('/:listingId/status', authenticate, listingController.toggleListingStatus);

// DELETE /:listingId - Soft delete a listing
// Only allowed if no active bookings exist
router.delete('/:listingId', authenticate, listingController.deleteListing);

module.exports = router; 