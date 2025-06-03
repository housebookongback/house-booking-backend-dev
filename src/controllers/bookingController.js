const db = require('../models');
const { ValidationError } = require('sequelize');
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const notificationService = require('../services/notificationService');

const bookingController = {
    createBookingRequest: async (req, res) => {
        const { listingId, startDate, endDate, numberOfGuests, message } = req.body;
    
        try {
            // 1. Validate required fields
            if (!listingId || !startDate || !endDate || !numberOfGuests) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    details: {
                        listingId: !listingId ? 'Listing ID is required' : null,
                        startDate: !startDate ? 'Start date is required' : null,
                        endDate: !endDate ? 'End date is required' : null,
                        numberOfGuests: !numberOfGuests ? 'Number of guests is required' : null
                    }
                });
            }
    
            // 2. Get the listing
            const listing = await db.Listing.findOne({
                where: { 
                    id: listingId,
                    status: 'published',
                    isActive: true
                }
            });
    
            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not available'
                });
            }
    
            // 3. Validate dates
            const checkIn = new Date(startDate);
            const checkOut = new Date(endDate);
            const today = new Date();
    
            if (checkIn < today) {
                return res.status(400).json({
                    success: false,
                    error: 'Check-in date must be in the future'
                });
            }
    
            if (checkOut <= checkIn) {
                return res.status(400).json({
                    success: false,
                    error: 'Check-out date must be after check-in date'
                });
            }
    
            // 4. Validate guest count
            if (numberOfGuests < 1 || numberOfGuests > listing.accommodates) {
                return res.status(400).json({
                    success: false,
                    error: `Number of guests must be between 1 and ${listing.accommodates}`
                });
            }
    
            // 5. Check availability and get calendar information
            const calendarEntries = await db.BookingCalendar.findByDateRange(
                listingId,
                startDate,
                endDate
            );

            // Check each day's availability and constraints
            const unavailableDates = [];
            let minStayRequired = 1;
            let maxStayAllowed = null;

            for (const entry of calendarEntries) {
                if (!entry.isAvailable) {
                    unavailableDates.push(entry.date);
                }
                if (entry.minStay > minStayRequired) {
                    minStayRequired = entry.minStay;
                }
                if (entry.maxStay && (!maxStayAllowed || entry.maxStay < maxStayAllowed)) {
                    maxStayAllowed = entry.maxStay;
                }
            }

            // Fallback to listing-level min/max stay if not found in calendar
            if ((minStayRequired === 1 || !minStayRequired) && listing.minStay) {
                minStayRequired = listing.minStay;
            }
            if ((maxStayAllowed === null || maxStayAllowed === undefined) && listing.maxStay) {
                maxStayAllowed = listing.maxStay;
            }
            if (maxStayAllowed === null || maxStayAllowed === undefined) {
                maxStayAllowed = 365; // or your chosen default
            }

            // Calculate number of nights
            const requestedNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

            // Check if calendarEntries covers all requested nights
            let warning = null;
            let availableDates = [];
            if (!calendarEntries || calendarEntries.length < requestedNights) {
                availableDates = await db.BookingCalendar.findAll({
                    where: {
                        listingId,
                        isAvailable: true
                    },
                    order: [['date', 'ASC']]
                });
                warning = 'Some or all dates in the selected range are not available in the calendar';
            }

            // Validate stay duration against requirements
            if (requestedNights < minStayRequired || (maxStayAllowed && requestedNights > maxStayAllowed)) {
                // Find all available dates for the listing
                const availableDates = await db.BookingCalendar.findAll({
                    where: {
                        listingId,
                        isAvailable: true
                    },
                    order: [['date', 'ASC']]
                });

                let errorMsg = requestedNights < minStayRequired
                    ? 'Minimum stay requirement not met'
                    : 'Maximum stay limit exceeded';

                return res.status(400).json({
                    success: false,
                    error: errorMsg,
                    stayRequirements: {
                        minimumNights: minStayRequired,
                        maximumNights: maxStayAllowed
                    },
                    availableDates: availableDates.map(d => d.date)
                });
            }

            // 6. Calculate total price
            let totalPrice = 0;
            if (calendarEntries && calendarEntries.length === requestedNights) {
                // All days are available in the calendar, use their prices
                for (const entry of calendarEntries) {
                    totalPrice += parseFloat(entry.basePrice);
                }
            } else {
                // Fallback: use listing's pricePerNight for all requested nights
                totalPrice = requestedNights * parseFloat(listing.pricePerNight || 0);
            }
            if (listing.cleaningFee) {
                totalPrice += parseFloat(listing.cleaningFee);
            }
            if (listing.securityDeposit) {
                totalPrice += parseFloat(listing.securityDeposit);
            }
            totalPrice = parseFloat(totalPrice.toFixed(2));

            // Prevent creation if totalPrice is zero
            if (totalPrice <= 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot create booking request: total price is zero. Please select available dates.'
                });
            }
    
            // 7. Create booking request
            const bookingRequest = await db.BookingRequest.create({
                listingId,
                guestId: req.user.id,
                hostId: listing.hostId,
                checkIn: startDate,
                checkOut: endDate,
                numberOfGuests,
                totalPrice,
                message,
                status: 'pending'
            });
    
            // Notify the host
            await notificationService.createBookingNotification({
                userId: listing.hostId,
                type: 'info',
                title: 'New Booking Request',
                message: `You have a new booking request from ${req.user.name} for ${listing.title}`,
                metadata: {
                    bookingRequestId: bookingRequest.id,
                    listingId: listing.id,
                    guestId: req.user.id
                }
            });
    
            // 8. Send response
            return res.status(201).json({data:{
                success: true,
                message: warning
                    ? 'Booking request created, but with a warning'
                    : 'Booking request created successfully',
                warning,
                stayRequirements: {
                    minimumNights: minStayRequired,
                    maximumNights: maxStayAllowed
                },
                availableDates: availableDates.map(d => d.date),
                suggestion: warning
                    ? 'Please adjust your dates based on the stay requirements and availability'
                    : undefined,
                data: {
                    id: bookingRequest.id,
                    listingId: bookingRequest.listingId,
                    guestId: bookingRequest.guestId,
                    hostId: bookingRequest.hostId,
                    checkIn: bookingRequest.checkIn,
                    checkOut: bookingRequest.checkOut,
                    numberOfGuests: bookingRequest.numberOfGuests,
                    totalPrice: bookingRequest.totalPrice,
                    status: bookingRequest.status,
                    message: bookingRequest.message,
                    expiresAt: bookingRequest.expiresAt,
                    createdAt: bookingRequest.createdAt
                }
            }});
    
        } catch (error) {
            console.error('Error creating booking request:', error);
    
            if (error instanceof ValidationError) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation error',
                    details: error.errors.map(err => ({
                        field: err.path,
                        message: err.message
                    }))
                });
            }
            return res.status(500).json({data:{
                success: false,
                error: 'Failed to create booking request'
            }});
        }
    }
    ,
    updateBookingRequestStatus: async (req, res) => {
        const { requestId } = req.params;
        const { status, responseMessage } = req.body;
       
        const hostId = req.user.id;
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or missing status. Must be "approved" or "rejected".'
            });
        }
        try {
            // Start a transaction
            const result = await db.sequelize.transaction(async (t) => {
                // Find the booking request with its listing
                const bookingRequest = await db.BookingRequest.findOne({
                    where: { 
                        id: requestId,
                        hostId: hostId,
                        status: 'pending'
                    },
                    include: [{
                        model: db.Listing,
                        as: 'listing'
                    }],
                    transaction: t
                });

                if (!bookingRequest) {
                    throw new Error('Booking request not found or already processed');
                }

                // Update the request status
                await bookingRequest.update({
                    status,
                    responseMessage,
                    responseDate: new Date()
                }, { transaction: t });

                // If approved, create the actual booking
                if (status === 'approved') {
                    // Check for date conflicts again
                    const conflicts = await bookingRequest.checkDateConflicts();
                    if (conflicts.length > 0) {
                        throw new Error('Selected dates conflict with existing bookings');
                    }

                    // Create the booking
                    const booking = await db.Booking.create({
                        listingId: bookingRequest.listingId,
                        guestId: bookingRequest.guestId,
                        hostId: bookingRequest.hostId,
                        checkIn: bookingRequest.checkIn,
                        checkOut: bookingRequest.checkOut,
                        numberOfGuests: bookingRequest.numberOfGuests,
                        totalPrice: bookingRequest.totalPrice,
                        status: 'pending',
                        paymentStatus: 'pending',
                        specialRequests: bookingRequest.message
                    }, { transaction: t });

                    // Update calendar availability
                    await db.BookingCalendar.update(
                        { isAvailable: false },
                        {
                            where: {
                                listingId: bookingRequest.listingId,
                                date: {
                                    [Op.between]: [bookingRequest.checkIn, bookingRequest.checkOut]
                                }
                            },
                            validate: false,
                            transaction: t
                        }
                    );

                    // Notify guest about approval
                    await notificationService.createBookingNotification({
                        userId: bookingRequest.guestId,
                        type: 'success',
                        title: 'Booking Request Approved',
                        message: `Your booking request for ${bookingRequest.listing.title} has been approved`,
                        metadata: {
                            bookingRequestId: bookingRequest.id,
                            bookingId: booking.id,
                            listingId: bookingRequest.listingId
                        }
                    });

                    return { bookingRequest, booking };
                } else if (status === 'rejected') {
                    // Notify guest about rejection
                    await notificationService.createBookingNotification({
                        userId: bookingRequest.guestId,
                        type: 'warning',
                        title: 'Booking Request Rejected',
                        message: `Your booking request for ${bookingRequest.listing.title} has been rejected`,
                        metadata: {
                            bookingRequestId: bookingRequest.id,
                            listingId: bookingRequest.listingId
                        }
                    });
                }

                return { bookingRequest };
            });

            return res.status(200).json({
                success: true,
                message: `Booking request ${status} successfully`,
                data: {
                    requestId: result.bookingRequest.id,
                    status: result.bookingRequest.status,
                    responseMessage: result.bookingRequest.responseMessage,
                    responseDate: result.bookingRequest.responseDate,
                    booking: result.booking ? {
                        id: result.booking.id,
                        status: result.booking.status,
                        paymentStatus: result.booking.paymentStatus
                    } : null
                }
            });

        } catch (error) {
            console.error('Error updating booking request:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to update booking request'
            });
        }
    },
    updateBookingStatus: async (req, res) => {
        const { id } = req.params;
        const { status, reason } = req.body;
        const hostId = req.user.id;

        // Valid status transitions
        const validStatuses = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['completed', 'cancelled'],
            'completed': [], // terminal state
            'cancelled': []  // terminal state
        };

        try {
            // Start a transaction
            const result = await db.sequelize.transaction(async (t) => {
                // Find the booking
                const booking = await db.Booking.findOne({
                    where: { 
                        id: id,
                        hostId: hostId
                    },
                    include: [{
                        model: db.Listing,
                        as: 'listing'
                    }],
                    transaction: t
                });

                if (!booking) {
                    throw new Error('Booking not found');
                }

                // Validate status transition
                const currentStatus = booking.status;
                
                if (!validStatuses[currentStatus].includes(status)) {
                    throw new Error(`Cannot change status from ${currentStatus} to ${status}`);
                }

                // Update booking status
                await booking.update({
                    status,
                    statusReason: reason,
                    statusUpdatedAt: new Date()
                }, { transaction: t });

                // Handle calendar updates for cancellations
                if (status === 'cancelled') {
                    await db.BookingCalendar.update(
                        { isAvailable: true },
                        {
                            where: {
                                listingId: booking.listingId,
                                date: {
                                    [Op.between]: [booking.checkIn, booking.checkOut]
                                }
                            },
                            transaction: t
                        }
                    );

                    // Notify both guest and host about cancellation
                    await notificationService.createBookingNotification({
                        userId: booking.guestId,
                        type: 'warning',
                        title: 'Booking Cancelled',
                        message: `Your booking for ${booking.listing.title} has been cancelled`,
                        metadata: {
                            bookingId: booking.id,
                            listingId: booking.listingId,
                            reason: reason
                        }
                    });

                    await notificationService.createBookingNotification({
                        userId: booking.hostId,
                        type: 'warning',
                        title: 'Booking Cancelled',
                        message: `A booking for ${booking.listing.title} has been cancelled`,
                        metadata: {
                            bookingId: booking.id,
                            listingId: booking.listingId,
                            reason: reason
                        }
                    });
                } else if (status === 'confirmed') {
                    // Notify guest about confirmation
                    await notificationService.createBookingNotification({
                        userId: booking.guestId,
                        type: 'success',
                        title: 'Booking Confirmed',
                        message: `Your booking for ${booking.listing.title} has been confirmed`,
                        metadata: {
                            bookingId: booking.id,
                            listingId: booking.listingId
                        }
                    });
                } else if (status === 'completed') {
                    // Notify both guest and host about completion
                    await notificationService.createBookingNotification({
                        userId: booking.guestId,
                        type: 'success',
                        title: 'Stay Completed',
                        message: `Your stay at ${booking.listing.title} has been completed`,
                        metadata: {
                            bookingId: booking.id,
                            listingId: booking.listingId
                        }
                    });

                    await notificationService.createBookingNotification({
                        userId: booking.hostId,
                        type: 'success',
                        title: 'Stay Completed',
                        message: `A guest has completed their stay at ${booking.listing.title}`,
                        metadata: {
                            bookingId: booking.id,
                            listingId: booking.listingId
                        }
                    });
                }

                return booking;
            });

            return res.status(200).json({
                success: true,
                message: `Booking status updated to ${status} successfully`,
                data: {
                    bookingId: result.id,
                    status: result.status,
                    statusReason: result.statusReason,
                    statusUpdatedAt: result.statusUpdatedAt
                }
            });

        } catch (error) {
            console.error('Error updating booking status:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to update booking status'
            });
        }
    },
    getHostBookings: async (req, res) => {
        const { status, startDate, endDate, listingId, search } = req.query;
        const hostId = req.user.id;

        try {
            const where = { hostId };
            
            // Add filters
            if (status) where.status = status;
            if (listingId) where.listingId = listingId;
            if (startDate && endDate) {
                where.checkIn = { [Op.between]: [startDate, endDate] };
            }

            const bookings = await db.Booking.findAll({
                where,
                include: [
                    {
                        model: db.User,
                        as: 'guest',
                        attributes: ['id', 'name', 'email', 'phone']
                    },
                    {
                        model: db.Listing,
                        as: 'listing',
                        attributes: ['id', 'title', 'address']
                    }
                ],
                order: [['checkIn', 'DESC']]
            });

            return res.json({
                success: true,
                data: bookings
            });
        } catch (error) {
            console.error('Error fetching host bookings:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch bookings'
            });
        }
    },
    getBookingDetails: async (req, res) => {
        const { bookingId } = req.params;
        const hostId = req.user.id;

        try {
            console.log(`[BOOKING CONTROLLER] Looking for booking with ID: ${bookingId}`);
            
            // Find the booking with necessary related data
                const booking = await db.Booking.findOne({
                    where: { id: bookingId },
                    include: [
                        {
                            model: db.User,
                            as: 'guest',
                            attributes: ['id', 'name', 'email', 'phone']
                        },
                        {
                            model: db.Listing,
                        as: 'listing',
                        // Include ALL fields needed for price calculation
                        attributes: ['id', 'title', 'address', 'pricePerNight', 'cleaningFee', 'securityDeposit', 'accommodates']
                    }
                ]
            });

            if (!booking) {
                console.log(`[BOOKING CONTROLLER] No booking found with ID: ${bookingId}`);
                return res.status(404).json({
                    success: false,
                    error: 'Booking not found'
                });
            }
            
            console.log(`[BOOKING CONTROLLER] Found booking with ID: ${bookingId}, hostId: ${booking.hostId}`);
            console.log('[BOOKING CONTROLLER] Listing price details:', {
                pricePerNight: booking.listing?.pricePerNight,
                cleaningFee: booking.listing?.cleaningFee,
                securityDeposit: booking.listing?.securityDeposit
            });

            return res.json({
                success: true,
                data: booking
            });
        } catch (error) {
            console.error('Error fetching booking details:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch booking details: ' + error.message
            });
        }
    },
    getHostCalendar: async (req, res) => {
        const { month, year } = req.query;
        const hostId = req.user.id;

        try {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);

            const bookings = await db.Booking.findAll({
                where: {
                    hostId,
                    checkIn: { [Op.between]: [startDate, endDate] }
                },
                include: [
                    {
                        model: db.Listing,
                        as: 'listing',
                        attributes: ['id', 'title']
                    },
                    {
                        model: db.User,
                        as: 'guest',
                        attributes: ['id', 'name', 'email', 'phone']
                    }
                ]
            });

            return res.json({
                success: true,
                data: bookings
            });
        } catch (error) {
            console.error('Error fetching host calendar:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch calendar data'
            });
        }
    },
    /**
     * Cancel a booking
     * @route POST /api/bookings/:id/cancel
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @returns {object} JSON response with the updated booking
     */
    cancelBooking: async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const userId = req.user.id;

            // Find the booking
            const booking = await db.Booking.findOne({
                where: { id },
                include: [
                    {
                        model: db.Listing,
                        as: 'listing',
                        attributes: ['id', 'title', 'hostId']
                    }
                ]
            });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: 'Booking not found'
                });
            }

            // Check authorization - only allow host or guest to cancel
            const isHost = booking.hostId === userId;
            const isGuest = booking.guestId === userId;

            if (!isHost && !isGuest) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to cancel this booking'
                });
            }

            // Check if booking can be cancelled
            if (booking.status === 'cancelled') {
                return res.status(400).json({
                    success: false,
                    error: 'Booking is already cancelled'
                });
            }

            if (booking.status === 'completed') {
                return res.status(400).json({
                    success: false,
                    error: 'Completed bookings cannot be cancelled'
                });
            }

            // Update booking status without interacting with BookingCalendar
            await db.Booking.update({
                status: 'cancelled',
                cancellationReason: reason,
                cancelledBy: userId
            }, {
                where: { id },
                individualHooks: false // Skip triggers/hooks to avoid BookingCalendar updates
            });

            // Get the updated booking
            const updatedBooking = await db.Booking.findByPk(id);

            // Return success response
            res.json({
                success: true,
                message: 'Booking cancelled successfully',
                data: updatedBooking
            });
        } catch (error) {
            console.error('Error cancelling booking:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to cancel booking'
            });
        }
    },
    /**
     * Edit a booking
     * @route PUT /api/bookings/:id/edit
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @returns {object} JSON response with the updated booking
     */
    editBooking: async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                checkIn, 
                checkOut, 
                numberOfGuests, 
                specialRequests, 
                totalPrice: requestTotalPrice,
                forceUpdate = false  // Add forceUpdate flag with false default
            } = req.body;
            
            console.log('[EDIT BOOKING] Request body:', req.body);
            
            if (requestTotalPrice !== undefined) {
                console.log('[EDIT BOOKING] Using client-provided total price:', requestTotalPrice);
            }
            
            if (forceUpdate) {
                console.log('[EDIT BOOKING] Force update is enabled - will bypass validation checks');
            }
            
            // Get booking with related data - don't look for forceUpdate column
            const booking = await db.Booking.findByPk(id, {
                include: [
                    { model: db.Listing, as: 'listing' },
                    { model: db.User, as: 'guest' },
                    { model: db.User, as: 'host' }
                ]
            });
            
            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: 'Booking not found'
                });
            }
            
            // For security, check if the user is the host of this booking
            const currentUserId = req.user.id;
            if (booking.hostId !== currentUserId && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    error: 'You do not have permission to edit this booking'
                });
            }
            
            // Check if booking can be edited - allow pending, confirmed, and cancelled bookings
            if (!['pending', 'confirmed', 'cancelled'].includes(booking.status)) {
                return res.status(400).json({
                    success: false,
                    error: `Cannot edit a booking with status "${booking.status}"`
                });
            }
            
            // Start a transaction
            const result = await db.sequelize.transaction(async (t) => {
                // Keep track of what was updated
                const updates = {};
                let recalculateTotalPrice = false;
                
                // For cancelled bookings, don't try to update calendar
                const isCancelled = booking.status === 'cancelled';
                
                // Update dates and free up or block calendar dates if needed
                if (!isCancelled && ((checkIn && checkIn !== booking.checkIn) || 
                    (checkOut && checkOut !== booking.checkOut))) {
                    
                    // Validate dates - only if forceUpdate is false
                    if (!forceUpdate) {
                        const newCheckIn = checkIn ? new Date(checkIn) : new Date(booking.checkIn);
                        const newCheckOut = checkOut ? new Date(checkOut) : new Date(booking.checkOut);
                        const today = new Date();
                        
                        // Basic date validation
                        if (newCheckIn < today) {
                            throw new Error('Check-in date must be in the future');
                        }
                        
                        if (newCheckOut <= newCheckIn) {
                            throw new Error('Check-out date must be after check-in date');
                        }
                    }
                    
                    // Check availability for the new dates (only if dates changed)
                    if ((checkIn && checkIn !== booking.checkIn) || (checkOut && checkOut !== booking.checkOut)) {
                        
                        try {
                            // First, restore availability for the current booking dates
                            await db.BookingCalendar.update(
                                { isAvailable: true },
                                {
                                    where: {
                                        listingId: booking.listingId,
                                        date: {
                                            [Op.between]: [booking.checkIn, booking.checkOut]
                                        }
                                    },
                                    transaction: t
                                }
                            );
                        } catch (error) {
                            console.log('[EDIT BOOKING] Error restoring availability for current dates:', error.message);
                            // Continue even if this fails
                        }
                        
                        // Skip availability check if forceUpdate is true
                        if (!forceUpdate) {
                            try {
                                const newCheckIn = checkIn ? new Date(checkIn) : new Date(booking.checkIn);
                                const newCheckOut = checkOut ? new Date(checkOut) : new Date(booking.checkOut);
                                
                                const calendarEntries = await db.BookingCalendar.findAll({
                                    where: {
                                        listingId: booking.listingId,
                                        date: {
                                            [Op.between]: [newCheckIn, newCheckOut]
                                        }
                                    },
                                    transaction: t
                                });
                                
                                // Generate an array of all dates in the range
                                const dates = [];
                                const currentDate = new Date(newCheckIn);
                                while (currentDate < newCheckOut) {
                                    dates.push(new Date(currentDate));
                                    currentDate.setDate(currentDate.getDate() + 1);
                                }
                                
                                // Create a map of calendar entries
                                const calendarMap = new Map(
                                    calendarEntries.map(entry => {
                                        const dateObj = new Date(entry.date);
                                        return [dateObj.toISOString().split('T')[0], entry];
                                    })
                                );
                                
                                // Check if all dates are available
                                for (const date of dates) {
                                    const dateStr = date.toISOString().split('T')[0];
                                    const entry = calendarMap.get(dateStr);
                                    
                                    if (!entry || !entry.isAvailable) {
                                        // Reblock the original dates since we're rolling back
                                        try {
                                            await db.BookingCalendar.update(
                                                { isAvailable: false },
                                                {
                                                    where: {
                                                        listingId: booking.listingId,
                                                        date: {
                                                            [Op.between]: [booking.checkIn, booking.checkOut]
                                                        }
                                                    },
                                                    transaction: t
                                                }
                                            );
                                        } catch (restoreError) {
                                            console.log('[EDIT BOOKING] Error restoring blocked dates:', restoreError.message);
                                        }
                                        throw new Error(`Listing is not available for ${dateStr}`);
                                    }
                                }
                            } catch (error) {
                                if (!forceUpdate) {
                                    throw error; // Re-throw if not force update
                                }
                                console.log('[EDIT BOOKING] Availability check failed but continuing due to forceUpdate:', error.message);
                            }
                        } else {
                            console.log('[EDIT BOOKING] Force update is enabled - bypassing availability check');
                        }
                        
                        // Calculate new total price based on the new dates
                        let totalPrice = 0;
                        
                        try {
                            // Calculate number of nights (difference between checkIn and checkOut in days)
                            const checkInDate = checkIn ? new Date(checkIn) : new Date(booking.checkIn);
                            const checkOutDate = checkOut ? new Date(checkOut) : new Date(booking.checkOut);
                            const numberOfNights = Math.floor((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
                            
                            // Get the price per night from listing
                            const pricePerNight = parseFloat(booking.listing.pricePerNight || 0);
                            
                            // Calculate base total (nights * price)
                            totalPrice = numberOfNights * pricePerNight;
                            
                            // Add cleaning fee and security deposit (assuming they're in the listing model)
                            if (booking.listing.cleaningFee) {
                                totalPrice += parseFloat(booking.listing.cleaningFee);
                            }
                            if (booking.listing.securityDeposit) {
                                totalPrice += parseFloat(booking.listing.securityDeposit);
                            }
                            
                            totalPrice = parseFloat(totalPrice.toFixed(2));
                        } catch (error) {
                            console.log('[EDIT BOOKING] Error calculating price:', error.message);
                            // If calculation fails, use the requested total price
                            totalPrice = requestTotalPrice !== undefined ? parseFloat(requestTotalPrice) : booking.totalPrice;
                        }
                        
                        try {
                            // Block the new dates (or clear them if forceUpdate is true)
                            await db.BookingCalendar.update(
                                { isAvailable: false },
                                {
                                    where: {
                                        listingId: booking.listingId,
                                        date: {
                                            [Op.between]: [
                                                checkIn ? new Date(checkIn) : new Date(booking.checkIn), 
                                                checkOut ? new Date(checkOut) : new Date(booking.checkOut)
                                            ]
                                        }
                                    },
                                    transaction: t
                                }
                            );
                        } catch (error) {
                            console.log('[EDIT BOOKING] Error blocking new dates:', error.message);
                            // Continue even if this fails when using forceUpdate
                            if (!forceUpdate) {
                                throw error;
                            }
                        }
                        
                        // Update the booking object
                        if (checkIn) {
                            booking.checkIn = checkIn;
                            updates.checkIn = checkIn;
                        }
                        if (checkOut) {
                            booking.checkOut = checkOut;
                            updates.checkOut = checkOut;
                        }
                        
                        booking.totalPrice = totalPrice;
                        updates.totalPrice = totalPrice;
                        recalculateTotalPrice = false;  // Already recalculated
                    }
                } else if (isCancelled && ((checkIn && checkIn !== booking.checkIn) || 
                    (checkOut && checkOut !== booking.checkOut))) {
                    // For cancelled bookings, just update the dates without calendar operations
                    if (checkIn) {
                        booking.checkIn = checkIn;
                        updates.checkIn = checkIn;
                    }
                    if (checkOut) {
                        booking.checkOut = checkOut;
                        updates.checkOut = checkOut;
                    }
                }
                
                // Update number of guests
                if (numberOfGuests && numberOfGuests !== booking.numberOfGuests) {
                    // Validate guest count - skip if forceUpdate is true
                    if (!forceUpdate && !isCancelled) {
                        if (numberOfGuests < 1 || numberOfGuests > booking.listing.accommodates) {
                            throw new Error(`Number of guests must be between 1 and ${booking.listing.accommodates}`);
                        }
                    }
                    
                    booking.numberOfGuests = numberOfGuests;
                    updates.numberOfGuests = numberOfGuests;
                    recalculateTotalPrice = !isCancelled && !forceUpdate;  // Only recalculate if booking is not cancelled and not force update
                }
                
                // Update special requests
                if (specialRequests !== undefined && specialRequests !== booking.specialRequests) {
                    booking.specialRequests = specialRequests;
                    updates.specialRequests = specialRequests;
                }
                
                // If client provided a totalPrice directly, use that
                if (requestTotalPrice !== undefined) {
                    console.log('[EDIT BOOKING] Using client-provided total price:', requestTotalPrice);
                    booking.totalPrice = parseFloat(requestTotalPrice);
                    updates.totalPrice = booking.totalPrice;
                    recalculateTotalPrice = false; // Skip recalculation
                }
                
                // If we need to recalculate the price and haven't done so already (and it's not cancelled)
                if (recalculateTotalPrice && !isCancelled) {
                    try {
                        // Calculate new total price
                        let totalPrice = 0;
                        
                        // Calculate number of nights (difference between checkIn and checkOut in days)
                        const checkInDate = new Date(booking.checkIn);
                        const checkOutDate = new Date(booking.checkOut);
                        const numberOfNights = Math.floor((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
                        
                        console.log('[EDIT BOOKING] Recalculating price:', { 
                            checkIn: checkInDate, 
                            checkOut: checkOutDate, 
                            nights: numberOfNights,
                            pricePerNight: booking.listing.pricePerNight
                        });
                        
                        // Get the price per night from listing
                        const pricePerNight = parseFloat(booking.listing.pricePerNight);
                        
                        // Calculate base total (nights * price)
                        totalPrice = numberOfNights * pricePerNight;
                        
                        // Add fees
                        if (booking.listing.cleaningFee) {
                            totalPrice += parseFloat(booking.listing.cleaningFee);
                        }
                        if (booking.listing.securityDeposit) {
                            totalPrice += parseFloat(booking.listing.securityDeposit);
                        }
                        
                        booking.totalPrice = parseFloat(totalPrice.toFixed(2));
                        updates.totalPrice = booking.totalPrice;
                        
                        console.log('[EDIT BOOKING] Recalculated total price:', booking.totalPrice);
                    } catch (error) {
                        console.log('[EDIT BOOKING] Error recalculating price:', error.message);
                        // Don't fail if forceUpdate is true
                        if (!forceUpdate) {
                            throw error;
                        }
                    }
                }
                
                // Save the booking if any changes were made
                if (Object.keys(updates).length > 0) {
                    try {
                        // Pass the forceUpdate flag as an option
                        await booking.save({ 
                            transaction: t,
                            forceUpdate: forceUpdate, // Pass the flag to the hooks
                            validate: !forceUpdate // Skip validation if forceUpdate is true 
                        });
                        
                        // Create a notification for both guest and host
                        try {
                            const notifyUserId = booking.hostId;
                            await notificationService.createBookingNotification({
                                userId: notifyUserId,
                                type: 'info',
                                title: 'Booking Updated',
                                message: `A booking for ${booking.listing.title} has been updated`,
                                metadata: {
                                    bookingId: booking.id,
                                    listingId: booking.listingId,
                                    updates: Object.keys(updates)
                                }
                            }, { transaction: t });
                        } catch (notifyError) {
                            console.log('[EDIT BOOKING] Error creating notification:', notifyError.message);
                            // Don't fail the transaction if notification fails
                        }
                    } catch (saveError) {
                        console.log('[EDIT BOOKING] Error saving booking:', saveError.message);
                        // If force update is on, try a raw update query
                        if (forceUpdate) {
                            console.log('[EDIT BOOKING] Attempting raw update with forceUpdate');
                            
                            // Convert updates to a format suitable for a raw update
                            const rawUpdates = {};
                            if (updates.checkIn) rawUpdates.checkIn = updates.checkIn;
                            if (updates.checkOut) rawUpdates.checkOut = updates.checkOut;
                            if (updates.numberOfGuests) rawUpdates.numberOfGuests = updates.numberOfGuests;
                            if (updates.specialRequests !== undefined) rawUpdates.specialRequests = updates.specialRequests;
                            if (updates.totalPrice) rawUpdates.totalPrice = updates.totalPrice;
                            
                            // Execute raw update
                            await db.Booking.update(rawUpdates, {
                                where: { id: booking.id },
                                transaction: t,
                                individualHooks: false // Skip hooks entirely
                            });
                            
                            // Reload the booking after raw update
                            await booking.reload({ transaction: t });
                        } else {
                            throw saveError;
                        }
                    }
                } else {
                    // No changes were made
                    return {
                        booking,
                        updates: {},
                        message: 'No changes were made to the booking'
                    };
                }
                
                return {
                    booking,
                    updates,
                    message: 'Booking updated successfully'
                };
            });
            
            return res.status(200).json({
                success: true,
                message: result.message,
                data: {
                    bookingId: result.booking.id,
                    updates: result.updates,
                    booking: {
                        checkIn: result.booking.checkIn,
                        checkOut: result.booking.checkOut,
                        numberOfGuests: result.booking.numberOfGuests,
                        totalPrice: result.booking.totalPrice,
                        specialRequests: result.booking.specialRequests,
                        status: result.booking.status
                    }
                }
            });
        } catch (error) {
            console.error('Error updating booking:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Failed to update booking'
            });
        }
    }
};

module.exports = bookingController;