const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/authMiddleware');

/**
 * Host Routes - requires authentication
 */

// GET /host - Get all reviews for a host's listings
router.get('/host', authenticate, reviewController.getHostReviews);

// GET /listing/:listingId - Get all reviews for a specific listing
router.get('/listing/:listingId', authenticate, reviewController.getListingReviews);

// POST /:reviewId/respond - Respond to a review
router.post('/:reviewId/respond', authenticate, reviewController.respondToReview);

// DELETE /:reviewId/respond - Delete a response to a review
router.delete('/:reviewId/respond', authenticate, reviewController.deleteResponse);

// PATCH /:reviewId/respond/visibility - Toggle visibility of a review response
router.patch('/:reviewId/respond/visibility', authenticate, reviewController.toggleResponseVisibility);

// GET /property-types - Get all property types (for mapping IDs to names)
router.get('/property-types', reviewController.getPropertyTypes);

module.exports = router; 