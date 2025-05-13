const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const verifyHost = require('../middleware/hostMiddleware');
const bookingController = require('../controllers/bookingController');

// Create a new booking request
router.post('/request', authenticate, bookingController.createBookingRequest);

// Update booking request status (host only)
router.patch('/request/:requestId/status', authenticate, bookingController.updateBookingRequestStatus);

// Get booking details
//router.get('/:id', authenticate, bookingController.getBookingDetails);

// Update booking status (host only)
router.patch('/:id/status', authenticate, bookingController.updateBookingStatus);

// Host-specific routes
router.get('/host', authenticate, verifyHost, bookingController.getHostBookings);
router.get('/host/:bookingId', authenticate, verifyHost, bookingController.getBookingDetails);
router.get('/host/calendar', authenticate, verifyHost, bookingController.getHostCalendar);

// Get guest's bookings
//router.get('/guest/listings', authenticate, bookingController.getGuestBookings);

// Cancel booking
//router.post('/:id/cancel', authenticate, bookingController.cancelBooking);

// Get booking availability
//router.get('/:listingId/availability', bookingController.checkAvailability);

// Get calendar view
//router.get('/calendar', authenticate, verifyHost, bookingController.getHostCalendar);

module.exports = router; 