const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const verifyHost = require('../middleware/hostMiddleware');
const hostController = require('../controllers/hostController');
const listingController = require('../controllers/listingController');

/**
 * Host Registration Routes
 * Only requires user authentication
 */

// POST /register - Register as a host
// Body: displayName, bio (optional), phoneNumber (optional)
// Returns: Host profile details and initial verification status
router.post('/register', authenticate, hostController.register);

/**
 * Host Profile Management Routes
 * Requires both authentication and verified host status
 */

// GET /profile - Get host profile details
// Returns: Full host profile including verification status, ratings, response metrics
router.get('/profile', authenticate, verifyHost, hostController.getProfile);

// PUT /profile - Update host profile
// Body: displayName, bio, phoneNumber, preferredLanguage, etc.
router.put('/profile', authenticate, verifyHost, hostController.updateProfile);

/**
 * Host Verification Routes
 * Only requires user authentication
 */

// POST /verify - Submit verification documents
// Body: identity documents, address proof (multipart/form-data)
router.post('/verify', authenticate, hostController.submitVerification);

// GET /verification-status - Check verification status
// Returns: Current verification status, submitted documents, review status
router.get('/verification-status', authenticate, hostController.getVerificationStatus);

/**
 * Host Listings Management Routes
 * Requires both authentication and verified host status
 */

// GET /listings - Get all listings for the host
// Query params: page, limit, status, propertyType, priceRange, bedrooms, searchTerm, sortBy, sortOrder
// Returns: Paginated listings with stats and filters
router.get('/listings', authenticate, verifyHost, listingController.getHostListings);

/**
 * Host Preferences Routes
 * Requires both authentication and verified host status
 */

// PUT /notifications - Update notification preferences
// Body: email, sms, push notification preferences
router.put('/notifications', authenticate, verifyHost, hostController.updateNotificationPreferences);

module.exports = router;
