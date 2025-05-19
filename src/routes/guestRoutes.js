const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const guestController = require('../controllers/guestController');

/**
 * Guest Booking Management Routes
 * Requires authentication
 */

// GET /bookings - Get all bookings for the guest (with filters)
// Query params: status, startDate, endDate, page, limit, sortBy, sortOrder
router.get('/bookings', authenticate, guestController.getGuestBookings);

// GET /bookings/:bookingId - Get details for a specific booking
router.get('/bookings/:bookingId', authenticate, guestController.getGuestBookingDetails);

// POST /bookings/:bookingId/cancel - Cancel a booking
// Body: reason
router.post('/bookings/:bookingId/cancel', authenticate, guestController.cancelGuestBooking);

/**
 * Guest Booking Request Management Routes
 * Requires authentication
 * 
 * NOTE ON REQUEST WORKFLOW:
 * - Guests can only VIEW and CANCEL their booking requests
 * - Guests CANNOT approve requests (only hosts can do that)
 * - Approval happens in hostController.updateBookingRequestStatus
 * - After host approval, requests become actual bookings
 */

// GET /booking-requests - Get all booking requests for the guest (with filters)
// Query params: status, page, limit, sortBy, sortOrder
// This endpoint shows pending/approved/rejected/expired requests BEFORE they become bookings
router.get('/booking-requests', authenticate, guestController.getGuestBookingRequests);

// GET /booking-requests/:requestId - Get details for a specific booking request
// This endpoint shows a single request's details (status can be: pending/approved/rejected/expired)
router.get('/booking-requests/:requestId', authenticate, guestController.getGuestBookingRequestDetails);

// POST /booking-requests/:requestId/cancel - Cancel a pending booking request
// Body: reason (optional)
// This endpoint allows canceling ONLY pending requests (not approved/rejected ones)
router.post('/booking-requests/:requestId/cancel', authenticate, guestController.cancelGuestBookingRequest);

/**
 * Guest Review Management Routes
 * Requires authentication
 */

// POST /bookings/:bookingId/reviews - Submit a review for a booking
// Body: rating, comment
router.post('/bookings/:bookingId/reviews', authenticate, guestController.submitReview);

// GET /reviews - Get all reviews submitted by the guest
router.get('/reviews', authenticate, guestController.getGuestReviews);

/**
 * Guest Notification Routes
 * Requires authentication
 */

// GET /notifications - Get all notifications for the guest
// Query params: unreadOnly, page, limit
router.get('/notifications', authenticate, guestController.getGuestNotifications);

// PUT /notifications/:notificationId/read - Mark a notification as read
router.put('/notifications/:notificationId/read', authenticate, guestController.markNotificationAsRead);

// PUT /notifications/read-all - Mark all notifications as read
router.put('/notifications/read-all', authenticate, guestController.markAllNotificationsAsRead);

/**
 * Guest Profile Management Routes
 * Requires authentication
 */

// GET /profile - Get guest profile
router.get('/profile', authenticate, guestController.getGuestProfile);

// PUT /profile - Update guest profile
// Body: displayName, phoneNumber, dateOfBirth, preferredLanguage, preferredCurrency, preferences
router.put('/profile', authenticate, guestController.updateGuestProfile);

// Wishlist Management
router.get('/wishlist', authenticate, guestController.getWishlist);
router.post('/wishlist/listings/:listingId', authenticate, guestController.addToWishlist);
router.delete('/wishlist/listings/:listingId', authenticate, guestController.removeFromWishlist);

module.exports = router; 