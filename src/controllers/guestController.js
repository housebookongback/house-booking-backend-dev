const db = require('../models');
const { Op } = require('sequelize');

const guestController = {
    /**
     * Get all bookings for the authenticated guest
     * @route GET /api/guest/bookings
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @returns {object} JSON response with guest's bookings
     */
    getGuestBookings: async (req, res) => {
        try {
            const guestId = req.user.id;
            const { 
                status, 
                startDate, 
                endDate, 
                page = 1, 
                limit = 10,
                sortBy = 'checkIn',
                sortOrder = 'DESC'
            } = req.query;

            // Build query options
            const queryOptions = {
                where: { guestId },
                include: [
                    {
                        model: db.Listing,
                        as: 'listing',
                        attributes: ['id', 'title', 'address', 'pricePerNight'],
                        include: [
                            {
                                model: db.Photo,
                                as: 'photos',
                                attributes: ['id', 'url', 'isCover'],
                                where: { isCover: true },
                                required: false,
                                limit: 1
                            },
                            {
                                model: db.Location,
                                as: 'locationDetails',
                                attributes: ['id', 'name', 'city', 'state', 'country']
                            }
                        ]
                    },
                    {
                        model: db.User,
                        as: 'host',
                        attributes: ['id', 'name', 'email'],
                        include: [
                            {
                                model: db.HostProfile,
                                as: 'hostProfile',
                                attributes: ['id', 'displayName', 'phoneNumber', 'verificationStatus']
                            }
                        ]
                    }
                ],
                order: [[sortBy, sortOrder]],
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
                distinct: true
            };

            // Add filters if provided
            if (status) {
                queryOptions.where.status = status;
            }

            // Date range filter
            if (startDate && endDate) {
                queryOptions.where.checkIn = { 
                    [Op.between]: [new Date(startDate), new Date(endDate)] 
                };
            } else if (startDate) {
                queryOptions.where.checkIn = { [Op.gte]: new Date(startDate) };
            } else if (endDate) {
                queryOptions.where.checkIn = { [Op.lte]: new Date(endDate) };
            }

            // Get bookings and total count
            const { count, rows: bookings } = await db.Booking.findAndCountAll(queryOptions);

            // Calculate booking statistics
            const statistics = {
                total: count,
                upcoming: bookings.filter(b => new Date(b.checkIn) > new Date()).length,
                ongoing: bookings.filter(b => 
                    new Date(b.checkIn) <= new Date() && 
                    new Date(b.checkOut) >= new Date()
                ).length,
                completed: bookings.filter(b => b.status === 'completed').length,
                cancelled: bookings.filter(b => b.status === 'cancelled').length
            };

            res.json({
                success: true,
                data: {
                    bookings,
                    statistics,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(count / parseInt(limit))
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching guest bookings:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch bookings'
            });
        }
    },

    /**
     * Get details for a specific booking
     * @route GET /api/guest/bookings/:bookingId
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @returns {object} JSON response with the booking details
     */
    getGuestBookingDetails: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const guestId = req.user.id;

            const booking = await db.Booking.findOne({
                where: { 
                    id: bookingId,
                    guestId
                },
                include: [
                    {
                        model: db.Listing,
                        as: 'listing',
                        include: [
                            {
                                model: db.Photo,
                                as: 'photos',
                                attributes: ['id', 'url', 'isCover']
                            },
                            {
                                model: db.Location,
                                as: 'locationDetails'
                            },
                            {
                                model: db.PropertyRule,
                                as: 'propertyRules'
                            },
                            {
                                model: db.Amenity,
                                as: 'amenities'
                            }
                        ]
                    },
                    {
                        model: db.User,
                        as: 'host',
                        attributes: ['id', 'name', 'email'],
                        include: [
                            {
                                model: db.HostProfile,
                                as: 'hostProfile',
                                attributes: ['id', 'displayName', 'bio', 'phoneNumber']
                            }
                        ]
                    },
                    {
                        model: db.Payment,
                        as: 'payments'
                    },
                    {
                        model: db.Review,
                        as: 'review'
                    },
                    {
                        model: db.Message,
                        as: 'messages',
                        limit: 5,
                        order: [['createdAt', 'DESC']]
                    }
                ]
            });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: 'Booking not found'
                });
            }

            res.json({
                success: true,
                data: booking
            });
        } catch (error) {
            console.error('Error fetching booking details:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch booking details'
            });
        }
    },

    /**
     * Cancel a booking
     * @route POST /api/guest/bookings/:bookingId/cancel
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @returns {object} JSON response with the updated booking
     */
    cancelGuestBooking: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const { reason } = req.body;
            const guestId = req.user.id;

            // Verify booking exists and belongs to this guest
            const booking = await db.Booking.findOne({
                where: { id: bookingId, guestId },
                include: [
                    {
                        model: db.Listing,
                        as: 'listing',
                        attributes: ['id', 'title', 'cancellationPolicy']
                    }
                ]
            });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: 'Booking not found'
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

            // Check cancellation policy - simplified example
            const today = new Date();
            const checkIn = new Date(booking.checkIn);
            const daysUntilCheckIn = Math.ceil((checkIn - today) / (1000 * 60 * 60 * 24));
            
            let refundAmount = 0;
            const policy = booking.listing.cancellationPolicy;
            
            // Simplified cancellation policy logic (can be enhanced)
            if (policy === 'flexible') {
                // Full refund if cancelled 24 hours before check-in
                refundAmount = daysUntilCheckIn >= 1 ? booking.totalPrice : 0;
            } else if (policy === 'moderate') {
                // Full refund if cancelled 5 days before check-in
                refundAmount = daysUntilCheckIn >= 5 ? booking.totalPrice : 0;
            } else if (policy === 'strict') {
                // 50% refund if cancelled 7 days before check-in
                refundAmount = daysUntilCheckIn >= 7 ? booking.totalPrice * 0.5 : 0;
            }

            // Update booking within a transaction
            const result = await db.sequelize.transaction(async (t) => {
                // 1. Set booking status to cancelled
                await booking.update({
                    status: 'cancelled',
                    cancellationReason: reason,
                    cancelledBy: guestId
                }, { transaction: t });

                // 2. Create cancellation record
                const cancellation = await db.BookingCancellation.create({
                    bookingId: booking.id,
                    userId: guestId,
                    reason,
                    refundAmount,
                    policy: booking.listing.cancellationPolicy
                }, { transaction: t });

                // 3. Update BookingCalendar to make those dates available again
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

                // 4. Create a notification for the host
                await db.Notification.create({
                    userId: booking.hostId,
                    type: 'info',
                    category: 'booking',
                    title: 'Booking Cancelled',
                    message: `Booking #${booking.id} for ${booking.listing.title} has been cancelled by the guest.`,
                    metadata: {
                        bookingId: booking.id,
                        listingId: booking.listingId
                    }
                }, { transaction: t });

                return { booking, cancellation, refundAmount };
            });

            res.json({
                success: true,
                message: 'Booking cancelled successfully',
                data: {
                    booking: result.booking,
                    cancellationDetails: {
                        policy: booking.listing.cancellationPolicy,
                        refundAmount: result.refundAmount,
                        cancellationId: result.cancellation.id
                    }
                }
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
     * Submit a review for a completed booking
     * @route POST /api/guest/bookings/:bookingId/reviews
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @returns {object} JSON response with the created review
     */
    submitReview: async (req, res) => {
        try {
            const { bookingId } = req.params;
            const { rating, comment } = req.body;
            const guestId = req.user.id;

            // Validate input
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    error: 'Rating must be between 1 and 5'
                });
            }

            // Find the booking to verify it's completed and belongs to this guest
            const booking = await db.Booking.findOne({
                where: { 
                    id: bookingId, 
                    guestId,
                    status: 'completed'
                },
                include: [
                    {
                        model: db.Review,
                        as: 'review'
                    }
                ]
            });

            if (!booking) {
                return res.status(404).json({
                    success: false,
                    error: 'Eligible booking not found'
                });
            }

            // Check if review already exists
            if (booking.review) {
                return res.status(400).json({
                    success: false,
                    error: 'Review already submitted for this booking'
                });
            }

            // Create the review
            const review = await db.Review.create({
                bookingId,
                reviewerId: guestId,
                reviewedId: booking.hostId,
                rating,
                comment,
                type: 'host', // Guest reviewing host
                isPublic: true
            });

            res.status(201).json({
                success: true,
                message: 'Review submitted successfully',
                data: review
            });
        } catch (error) {
            console.error('Error submitting review:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to submit review'
            });
        }
    },

    /**
     * Get reviews created by the guest
     * @route GET /api/guest/reviews
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @returns {object} JSON response with the guest's reviews
     */
    getGuestReviews: async (req, res) => {
        try {
            const guestId = req.user.id;
            
            const reviews = await db.Review.findAll({
                where: { reviewerId: guestId },
                include: [
                    {
                        model: db.Booking,
                        as: 'booking',
                        include: [
                            {
                                model: db.Listing,
                                as: 'listing',
                                attributes: ['id', 'title']
                            }
                        ]
                    },
                    {
                        model: db.User,
                        as: 'reviewed',
                        attributes: ['id', 'name'],
                        include: [
                            {
                                model: db.HostProfile,
                                as: 'hostProfile',
                                attributes: ['id', 'displayName']
                            }
                        ]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            res.json({
                success: true,
                data: reviews
            });
        } catch (error) {
            console.error('Error fetching guest reviews:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch reviews'
            });
        }
    },

    /**
     * Get notifications for the guest
     * @route GET /api/guest/notifications
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @returns {object} JSON response with the guest's notifications
     */
    getGuestNotifications: async (req, res) => {
        try {
            const guestId = req.user.id;
            const { 
                unreadOnly,
                page = 1, 
                limit = 20
            } = req.query;
            
            const whereClause = { userId: guestId };
            if (unreadOnly === 'true') {
                whereClause.isRead = false;
            }
            
            const { count, rows: notifications } = await db.Notification.findAndCountAll({
                where: whereClause,
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            });

            res.json({
                success: true,
                data: {
                    notifications,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(count / parseInt(limit))
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch notifications'
            });
        }
    },

    /**
     * Mark a notification as read
     * @route PUT /api/guest/notifications/:notificationId/read
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @returns {object} JSON response confirming the update
     */
    markNotificationAsRead: async (req, res) => {
        try {
            const { notificationId } = req.params;
            const guestId = req.user.id;

            const notification = await db.Notification.findOne({
                where: { 
                    id: notificationId,
                    userId: guestId
                }
            });

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    error: 'Notification not found'
                });
            }

            await notification.update({
                isRead: true,
                readAt: new Date()
            });

            res.json({
                success: true,
                message: 'Notification marked as read',
                data: notification
            });
        } catch (error) {
            console.error('Error updating notification:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update notification'
            });
        }
    },

    /**
     * Mark all notifications as read
     * @route PUT /api/guest/notifications/read-all
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @returns {object} JSON response confirming the update
     */
    markAllNotificationsAsRead: async (req, res) => {
        try {
            const guestId = req.user.id;

            const result = await db.Notification.update(
                { 
                    isRead: true,
                    readAt: new Date()
                },
                { 
                    where: { 
                        userId: guestId,
                        isRead: false
                    }
                }
            );

            res.json({
                success: true,
                message: 'All notifications marked as read',
                data: {
                    updatedCount: result[0]
                }
            });
        } catch (error) {
            console.error('Error updating notifications:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update notifications'
            });
        }
    },

    /**
     * Get or create guest profile
     * @route GET /api/guest/profile
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @returns {object} JSON response with the guest's profile
     */
    getGuestProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            
            // Get user with basic info but exclude password
            const user = await db.User.findByPk(userId, {
                attributes: { exclude: ['passwordHash'] }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Get or create guest profile
            let guestProfile = await db.GuestProfile.findOne({
                where: { userId }
            });

            if (!guestProfile) {
                // Create a basic profile if none exists
                guestProfile = await db.GuestProfile.create({
                    userId,
                    displayName: user.name,
                    preferredLanguage: user.language || 'en',
                    preferredCurrency: user.currency || 'USD'
                });
            }

            // Get booking stats
            const bookingStats = await db.Booking.findAll({
                where: { guestId: userId },
                attributes: [
                    [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalBookings'],
                    [
                        db.sequelize.fn('SUM', 
                            db.sequelize.literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")
                        ), 
                        'completedBookings'
                    ]
                ]
            });

            // Combine user and profile data for response
            const profileData = {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    profilePicture: user.profilePicture,
                    language: user.language,
                    currency: user.currency,
                    country: user.country,
                    lastLogin: user.lastLogin
                },
                guestProfile: guestProfile.getProfileDetails(),
                stats: {
                    totalBookings: parseInt(bookingStats[0].dataValues.totalBookings || 0),
                    completedBookings: parseInt(bookingStats[0].dataValues.completedBookings || 0)
                }
            };

            res.json({
                success: true,
                data: profileData
            });
        } catch (error) {
            console.error('Error fetching guest profile:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch guest profile'
            });
        }
    },

    /**
     * Update guest profile
     * @route PUT /api/guest/profile
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @returns {object} JSON response with the updated profile
     */
    updateGuestProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            const { 
                displayName, 
                phoneNumber, 
                dateOfBirth, 
                preferredLanguage, 
                preferredCurrency,
                preferences 
            } = req.body;

            // Find the guest profile
            let guestProfile = await db.GuestProfile.findOne({
                where: { userId }
            });

            if (!guestProfile) {
                // Create a profile if it doesn't exist
                guestProfile = await db.GuestProfile.create({
                    userId,
                    displayName: displayName || req.user.name,
                    phoneNumber,
                    dateOfBirth,
                    preferredLanguage: preferredLanguage || 'en',
                    preferredCurrency: preferredCurrency || 'USD'
                });
            } else {
                // Update existing profile
                await guestProfile.update({
                    ...(displayName && { displayName }),
                    ...(phoneNumber && { phoneNumber }),
                    ...(dateOfBirth && { dateOfBirth }),
                    ...(preferredLanguage && { preferredLanguage }),
                    ...(preferredCurrency && { preferredCurrency })
                });
            }

            // Update preferences if provided
            if (preferences) {
                await guestProfile.updatePreferences(preferences);
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: guestProfile.getProfileDetails()
            });
        } catch (error) {
            console.error('Error updating guest profile:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update guest profile'
            });
        }
    },

    // Add a listing to wishlist
    addToWishlist: async (req, res) => {
        try {
            const { listingId } = req.params;
            const userId = req.user.id;
            
            // Verify listing exists
            const listing = await db.Listing.findByPk(listingId);
            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found'
                });
            }
            
            // Create wishlist entry
            const [wishlist, created] = await db.Wishlist.findOrCreate({
                where: { userId, listingId }
            });
            
            res.status(created ? 201 : 200).json({
                success: true,
                message: created ? 'Listing added to wishlist' : 'Listing already in wishlist',
                data: wishlist
            });
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to add listing to wishlist'
            });
        }
    },

    // Remove a listing from wishlist
    removeFromWishlist: async (req, res) => {
        try {
            const { listingId } = req.params;
            const userId = req.user.id;
            
            const result = await db.Wishlist.destroy({
                where: { userId, listingId }
            });
            
            if (result === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found in wishlist'
                });
            }
            
            res.json({
                success: true,
                message: 'Listing removed from wishlist'
            });
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to remove listing from wishlist'
            });
        }
    },

    // Get user's wishlist
    getWishlist: async (req, res) => {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10 } = req.query;
            
            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            const { count, rows: wishlists } = await db.Wishlist.findAndCountAll({
                where: { userId },
                include: [
                    {
                        model: db.Listing,
                        as: 'listing',
                        attributes: ['id', 'title', 'pricePerNight', 'address'],
                        include: [
                            {
                                model: db.Photo,
                                as: 'photos',
                                attributes: ['id', 'url'],
                                where: { isCover: true },
                                required: false,
                                limit: 1
                            },
                            {
                                model: db.Location,
                                as: 'locationDetails',
                                attributes: ['name', 'city', 'country']
                            }
                        ]
                    }
                ],
                limit: parseInt(limit),
                offset,
                order: [['createdAt', 'DESC']]
            });
            
            res.json({
                success: true,
                data: {
                    wishlists,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(count / parseInt(limit))
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch wishlist'
            });
        }
    },

    // Check if a listing is in wishlist
    isInWishlist: async (req, res) => {
        try {
            const { listingId } = req.params;
            const userId = req.user.id;
            
            const wishlist = await db.Wishlist.findOne({
                where: { userId, listingId }
            });
            
            res.json({
                success: true,
                data: { inWishlist: !!wishlist }
            });
        } catch (error) {
            console.error('Error checking wishlist:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to check wishlist status'
            });
        }
    },

    /**
     * Get all booking requests for the authenticated guest
     * @route GET /api/guest/booking-requests
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @returns {object} JSON response with guest's booking requests
     * 
     * IMPORTANT WORKFLOW NOTES:
     * - This method shows all booking requests (pending/approved/rejected/expired)
     * - Requests with status "pending" are awaiting host approval
     * - Approved requests will have a corresponding entry in the Bookings table
     * - Only hosts can approve requests through hostController.updateBookingRequestStatus
     */
    getGuestBookingRequests: async (req, res) => {
        try {
            const guestId = req.user.id;
            const { 
                status, 
                page = 1, 
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'DESC'
            } = req.query;

            // Build query options
            const queryOptions = {
                where: { guestId },
                include: [
                    {
                        model: db.Listing,
                        as: 'listing',
                        attributes: ['id', 'title', 'address', 'pricePerNight'],
                        include: [
                            {
                                model: db.Photo,
                                as: 'photos',
                                attributes: ['id', 'url', 'isCover'],
                                where: { isCover: true },
                                required: false,
                                limit: 1
                            },
                            {
                                model: db.Location,
                                as: 'locationDetails',
                                attributes: ['id', 'name', 'city', 'state', 'country']
                            }
                        ]
                    },
                    {
                        model: db.User,
                        as: 'host',
                        attributes: ['id', 'name', 'email'],
                        include: [
                            {
                                model: db.HostProfile,
                                as: 'hostProfile',
                                attributes: ['id', 'displayName', 'phoneNumber', 'verificationStatus']
                            }
                        ]
                    }
                ],
                order: [[sortBy, sortOrder]],
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
                distinct: true
            };

            // Add filters if provided
            if (status) {
                queryOptions.where.status = status;
            }

            // Get booking requests and total count
            const { count, rows: bookingRequests } = await db.BookingRequest.findAndCountAll(queryOptions);

            // Calculate statistics
            const statistics = {
                total: count,
                pending: bookingRequests.filter(br => br.status === 'pending').length,
                approved: bookingRequests.filter(br => br.status === 'approved').length,
                rejected: bookingRequests.filter(br => br.status === 'rejected').length,
                expired: bookingRequests.filter(br => br.status === 'expired').length
            };

            res.json({
                success: true,
                data: {
                    bookingRequests,
                    statistics,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(count / parseInt(limit))
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching guest booking requests:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch booking requests'
            });
        }
    },

    /**
     * Get details for a specific booking request
     * @route GET /api/guest/booking-requests/:requestId
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @returns {object} JSON response with the booking request details
     * 
     * WORKFLOW NOTES:
     * - Guests can view details but cannot approve their own requests
     * - Status field shows where the request is in the approval process:
     *   * "pending": Awaiting host action
     *   * "approved": Host accepted (should have a Booking record)
     *   * "rejected": Host declined
     *   * "expired": Request timed out with no host response
     */
    getGuestBookingRequestDetails: async (req, res) => {
        try {
            const { requestId } = req.params;
            const guestId = req.user.id;

            const bookingRequest = await db.BookingRequest.findOne({
                where: { 
                    id: requestId,
                    guestId
                },
                include: [
                    {
                        model: db.Listing,
                        as: 'listing',
                        include: [
                            {
                                model: db.Photo,
                                as: 'photos',
                                attributes: ['id', 'url', 'isCover']
                            },
                            {
                                model: db.Location,
                                as: 'locationDetails'
                            },
                            {
                                model: db.PropertyRule,
                                as: 'propertyRules'
                            },
                            {
                                model: db.Amenity,
                                as: 'amenities'
                            }
                        ]
                    },
                    {
                        model: db.User,
                        as: 'host',
                        attributes: ['id', 'name', 'email'],
                        include: [
                            {
                                model: db.HostProfile,
                                as: 'hostProfile',
                                attributes: ['id', 'displayName', 'bio', 'phoneNumber']
                            }
                        ]
                    }
                ]
            });

            if (!bookingRequest) {
                return res.status(404).json({
                    success: false,
                    error: 'Booking request not found'
                });
            }

            res.json({
                success: true,
                data: bookingRequest
            });
        } catch (error) {
            console.error('Error fetching booking request details:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch booking request details'
            });
        }
    },

    /**
     * Cancel a booking request
     * @route POST /api/guest/booking-requests/:requestId/cancel
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @returns {object} JSON response with the result of cancellation
     * 
     * WORKFLOW NOTES:
     * - Guests can only cancel PENDING requests
     * - This is different from canceling an approved booking
     * - Canceled requests are soft-deleted, not status-changed
     * - No refund processing is needed (unlike booking cancellations)
     */
    cancelGuestBookingRequest: async (req, res) => {
        try {
            const { requestId } = req.params;
            const { reason } = req.body;
            const guestId = req.user.id;

            // Verify booking request exists and belongs to this guest
            const bookingRequest = await db.BookingRequest.findOne({
                where: { 
                    id: requestId,
                    guestId
                }
            });

            if (!bookingRequest) {
                return res.status(404).json({
                    success: false,
                    error: 'Booking request not found'
                });
            }

            // Check if request can be cancelled
            if (bookingRequest.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    error: `Cannot cancel a booking request with status: ${bookingRequest.status}`
                });
            }

            // Soft delete the request (it's also good to notify the host)
            await bookingRequest.destroy();

            res.json({
                success: true,
                message: 'Booking request cancelled successfully',
                data: {
                    requestId: bookingRequest.id
                }
            });
        } catch (error) {
            console.error('Error cancelling booking request:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to cancel booking request'
            });
        }
    }
};

module.exports = guestController;
