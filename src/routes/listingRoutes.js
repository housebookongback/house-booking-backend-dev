const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { authenticate } = require('../middleware/authMiddleware');
const { uploadMultiple } = require('../middleware/upload');

// Debug controller methods
console.log('Controller methods:');
console.log('getAllListings:', typeof listingController.getAllListings);
console.log('getListingById:', typeof listingController.getListingById);
console.log('getPropertyTypes:', typeof listingController.getPropertyTypes);
console.log('getCategories:', typeof listingController.getCategories);
console.log('getAmenities:', typeof listingController.getAmenities);
console.log('getAvailability:', typeof listingController.getAvailability);
console.log('getCalendar:', typeof listingController.getCalendar);
console.log('getStepStatus:', typeof listingController.getStepStatus);
console.log('checkAndFixSchema:', typeof listingController.checkAndFixSchema);
console.log('getOneListing:', typeof listingController.getOneListing);
console.log('toggleListingStatus:', typeof listingController.toggleListingStatus);
console.log('forceUpdateStatus:', typeof listingController.forceUpdateStatus);
console.log('directUpdateListing:', typeof listingController.directUpdateListing);

/**
 * Public Routes - No authentication required
 */

// GET specific type endpoints first (more specific routes)
router.get('/property-types', listingController.getPropertyTypes);
router.get('/categories', listingController.getCategories);
router.get('/amenities', listingController.getAmenities);
router.get('/public', listingController.getAllListings);
router.get('/admin/check-schema', listingController.checkAndFixSchema);
router.get('/details/:listingId', listingController.getOneListing);

// GET endpoints with path parameters
router.get('/:listingId/availability', listingController.getAvailability);
router.get('/:listingId/calendar', listingController.getCalendar);
router.get('/:listingId/step-status', authenticate, listingController.getStepStatus);
router.get('/:listingId/public', listingController.getListingById);

/**
 * Protected Routes - Authentication required
 */

// GET listings with and without ID
router.get('/', authenticate, listingController.getAllListings);
router.get('/:listingId', authenticate, listingController.getListingById);

// POST routes
router.post('/draft', authenticate, listingController.createDraftListing);
router.post('/:listingId/photos', authenticate, uploadMultiple, listingController.addPhotos);
router.post('/:listingId/force-status-update', authenticate, listingController.forceUpdateStatus);
router.post('/:listingId/direct-update', authenticate, listingController.directUpdateListing);
router.post('/:listingId/update-details-pricing', authenticate, listingController.directUpdateDetailsAndPricing);

// PATCH routes
router.patch('/:listingId/basic-info', authenticate, listingController.updateBasicInfo);
router.patch('/:listingId/location', authenticate, listingController.updateLocation);
router.patch('/:listingId/details', authenticate, listingController.updateDetails);
router.patch('/:listingId/pricing', authenticate, listingController.updatePricing);
router.patch('/:listingId/photos', authenticate, uploadMultiple, listingController.updatePhotos);
router.patch('/:listingId/amenities', authenticate, listingController.updateAmenities);
router.patch('/:listingId/amenities-simple', authenticate, listingController.updateAmenitiesSimple);
router.patch('/:listingId/rules', authenticate, listingController.updateRules);
router.patch('/:listingId/calendar', authenticate, listingController.updateCalendar);
router.patch('/:listingId/step-status', authenticate, listingController.updateStepStatus);
router.patch('/:listingId/publish', authenticate, listingController.publishListing);
router.patch('/:listingId/toggle-status', authenticate, listingController.toggleListingStatus);
router.patch('/:listingId/toggle-visibility', authenticate, listingController.toggleListingVisibility);

// PUT and DELETE routes
router.put('/:listingId/photos/:photoId/feature', authenticate, listingController.setPhotoAsFeatured);
router.delete('/:listingId/photos/:photoId', authenticate, listingController.deletePhoto);
router.delete('/:listingId', authenticate, listingController.deleteListing);

module.exports = router; 