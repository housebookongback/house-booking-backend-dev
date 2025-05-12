const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const bookingController = require('../controllers/bookingController');

// Create a new booking request
router.post('/request', authenticate, bookingController.createBookingRequest);

// Update booking request status (host only)
router.patch('/request/:requestId/status', authenticate, bookingController.updateBookingRequestStatus);

// Get booking details
//router.get('/:id', authenticate, bookingController.getBookingDetails);

// Update booking status (host only)
//router.patch('/:id/status', authenticate, bookingController.updateBookingStatus);

// Get host's bookings
//router.get('/host/listings', authenticate, bookingController.getHostBookings);

// Get guest's bookings
//router.get('/guest/listings', authenticate, bookingController.getGuestBookings);

// Cancel booking
//router.post('/:id/cancel', authenticate, bookingController.cancelBooking);

// Get booking availability
//router.get('/:listingId/availability', bookingController.checkAvailability);

module.exports = router; 