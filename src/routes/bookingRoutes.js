const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const verifyHost = require('../middleware/hostMiddleware');
const bookingController = require('../controllers/bookingController');

// Add debug logging middleware
router.use((req, res, next) => {
  console.log(`[BOOKING ROUTES] ${req.method} ${req.originalUrl}`);
  next();
});

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

// Calendar route needs to come before the :bookingId route to avoid conflicts
router.get('/host/calendar', authenticate, verifyHost, bookingController.getHostCalendar);

// Now the bookingId route
router.get('/host/:bookingId', authenticate, verifyHost, (req, res) => {
  console.log('[DEBUG] Host booking details request received:');
  console.log('  bookingId:', req.params.bookingId);
  console.log('  user:', req.user);
  return bookingController.getBookingDetails(req, res);
});

// Add a debug test endpoint that doesn't require auth
router.get('/host-debug/:bookingId', (req, res) => {
  console.log('[DEBUG] Test booking details endpoint called');
  res.json({
    success: true,
    message: 'Debug endpoint working',
    bookingId: req.params.bookingId
  });
});

// Get guest's bookings
//router.get('/guest/listings', authenticate, bookingController.getGuestBookings);

// Cancel booking
router.post('/:id/cancel', authenticate, bookingController.cancelBooking);

// Edit booking
router.put('/:id/edit', authenticate, bookingController.editBooking);

// Get booking availability
//router.get('/:listingId/availability', bookingController.checkAvailability);

// Get calendar view
//router.get('/calendar', authenticate, verifyHost, bookingController.getHostCalendar);

module.exports = router;