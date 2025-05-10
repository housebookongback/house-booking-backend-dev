const db = require('../models');
const { ValidationError } = require('sequelize');

const { Op } = require('sequelize');

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

            // 5. Check availability
            const calendarEntries = await db.BookingCalendar.findAll({
                where: {
                    listingId,
                    date: {
                        [Op.between]: [startDate, endDate]
                    }
                }
            });

            // Check if all dates are available
            const dates = [];
            const currentDate = new Date(startDate);
            while (currentDate < checkOut) {
                dates.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }

            const calendarMap = new Map(
                calendarEntries.map(entry => {
                    const dateObj = new Date(entry.date); // ensure it's a Date object
                    return [dateObj.toISOString().split('T')[0], entry];
                })
            );

            for (const date of dates) {
                const dateStr = date.toISOString().split('T')[0];
                const entry = calendarMap.get(dateStr);
                
                if (!entry || !entry.isAvailable) {
                    return res.status(400).json({
                        success: false,
                        error: `Listing is not available for ${dateStr}`
                    });
                }
            }

            // 6. Calculate total price
            let totalPrice = 0;
            for (const date of dates) {
                const dateStr = date.toISOString().split('T')[0];
                const entry = calendarMap.get(dateStr);
                const price = entry ? parseFloat(entry.basePrice) : parseFloat(listing.pricePerNight);
                totalPrice += price;
            }
            
            // Add cleaning fee and security deposit
            if (listing.cleaningFee) {
                totalPrice += parseFloat(listing.cleaningFee);
            }
            if (listing.securityDeposit) {
                totalPrice += parseFloat(listing.securityDeposit);
            }
            
            totalPrice = parseFloat(totalPrice.toFixed(2));

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

            // 8. Send response
            return res.status(201).json({
                success: true,
                message: 'Booking request created successfully',
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
            });

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

            return res.status(500).json({
                success: false,
                error: 'Failed to create booking request'
            });
        }
    }
};

module.exports = bookingController; 