const { Op } = require('sequelize');
const db = require('../models');

/**
 * Review Controller
 * Handles all review-related operations
 */
const reviewController = {
  /**
   * Get all reviews for a host's listings
   * @route GET /api/reviews/host
   * @access Private - Host only
   * @returns {object} JSON response with the host's listings' reviews
   */
  getHostReviews: async (req, res) => {
    try {
      const hostId = req.user.id;
      console.log("Fetching reviews for host ID:", hostId);

      // Step 1: First get all listings owned by this host
      const hostListings = await db.Listing.findAll({
        where: { hostId },
        attributes: ['id', 'title', 'propertyTypeId']
      });

      if (!hostListings || hostListings.length === 0) {
        console.log(`No listings found for host ${hostId}`);
        return res.json({
          success: true,
          data: []
        });
      }

      const listingIds = hostListings.map(listing => listing.id);
      console.log(`Found ${listingIds.length} listings for host ${hostId}: ${listingIds.join(', ')}`);

      // Step 2: Get all bookings for these listings
      const bookings = await db.Booking.findAll({
        where: { 
          listingId: { [Op.in]: listingIds }
        },
        attributes: ['id', 'listingId', 'guestId']
      });

      if (!bookings || bookings.length === 0) {
        console.log(`No bookings found for host ${hostId}'s listings`);
        return res.json({
          success: true,
          data: []
        });
      }

      const bookingIds = bookings.map(booking => booking.id);
      console.log(`Found ${bookingIds.length} bookings for host's listings`);

      // Step 3: Get all reviews for these bookings
      const reviews = await db.Review.findAll({
        where: { 
          bookingId: { [Op.in]: bookingIds },
          type: 'host'  // Only reviews from guests to host
        }
      });

      console.log(`Found ${reviews.length} reviews for host ${hostId}'s listings`);

      // Step 4: Create a map of listings by ID for faster lookups
      const listingsMap = hostListings.reduce((map, listing) => {
        map[listing.id] = listing;
        return map;
      }, {});

      // Step 5: Create a map of bookings by ID
      const bookingsMap = bookings.reduce((map, booking) => {
        map[booking.id] = booking;
        return map;
      }, {});

      // Step 6: Create enhanced reviews with the necessary properties
      const enhancedReviews = reviews.map(review => {
        const booking = bookingsMap[review.bookingId];
        const listing = booking ? listingsMap[booking.listingId] : null;
        
        return {
          id: review.id,
          bookingId: review.bookingId,
          reviewerId: review.reviewerId,
          reviewedId: review.reviewedId,
          rating: review.rating,
          comment: review.comment,
          type: review.type,
          response: review.response,
          responseDate: review.responseDate,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          // Add the booking and listing information
          booking: {
            id: booking?.id,
            listingId: booking?.listingId,
            guestId: booking?.guestId,
            listing: {
              id: listing?.id,
              title: listing?.title || `Property ${booking?.listingId}`,
              propertyTypeId: listing?.propertyTypeId || 1
            }
          },
          // Add a placeholder reviewer
          reviewer: {
            id: review.reviewerId,
            name: `Guest ${review.reviewerId}`,
            profilePicture: null
          }
        };
      });

      res.json({
        success: true,
        data: enhancedReviews
      });
    } catch (error) {
      console.error('Error fetching host reviews:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch reviews'
      });
    }
  },

  /**
   * Get all reviews for a specific listing
   * @route GET /api/reviews/listing/:listingId
   * @access Private - Host only for their listings
   * @returns {object} JSON response with the listing's reviews
   */
  getListingReviews: async (req, res) => {
    try {
      const { listingId } = req.params;
      const hostId = req.user.id;
      console.log(`Fetching reviews for listing ${listingId} owned by host ${hostId}`);

      // Check if the listing belongs to the host
      const listing = await db.Listing.findOne({
        where: { id: listingId, hostId },
        attributes: ['id', 'title', 'propertyTypeId']
      });

      if (!listing) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: This listing does not belong to you'
        });
      }

      // Get all bookings for this listing
      const bookings = await db.Booking.findAll({
        where: { listingId },
        attributes: ['id', 'listingId', 'guestId']
      });

      if (!bookings || bookings.length === 0) {
        console.log(`No bookings found for listing ${listingId}`);
        return res.json({
          success: true,
          data: []
        });
      }

      const bookingIds = bookings.map(booking => booking.id);
      console.log(`Found ${bookingIds.length} bookings for listing ${listingId}`);

      // Get all reviews for these bookings
      const reviews = await db.Review.findAll({
        where: { 
          bookingId: { [Op.in]: bookingIds },
          type: 'host' // Only reviews from guests to hosts
        }
      });

      console.log(`Found ${reviews.length} reviews for listing ${listingId}`);

      // Create a map of bookings by ID
      const bookingsMap = bookings.reduce((map, booking) => {
        map[booking.id] = booking;
        return map;
      }, {});

      // Create enhanced reviews with the necessary properties
      const enhancedReviews = reviews.map(review => {
        const booking = bookingsMap[review.bookingId];
        
        return {
          id: review.id,
          bookingId: review.bookingId,
          reviewerId: review.reviewerId,
          reviewedId: review.reviewedId,
          rating: review.rating,
          comment: review.comment,
          type: review.type,
          response: review.response,
          responseDate: review.responseDate,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          // Add the booking and listing information
          booking: {
            id: booking?.id,
            listingId: booking?.listingId,
            guestId: booking?.guestId,
            listing: {
              id: listing.id,
              title: listing.title,
              propertyTypeId: listing.propertyTypeId
            }
          },
          // Add a placeholder reviewer
          reviewer: {
            id: review.reviewerId,
            name: `Guest ${review.reviewerId}`,
            profilePicture: null
          }
        };
      });

      res.json({
        success: true,
        data: enhancedReviews
      });
    } catch (error) {
      console.error('Error fetching listing reviews:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch reviews'
      });
    }
  },

  /**
   * Respond to a review
   * @route POST /api/reviews/:reviewId/respond
   * @access Private - Host only for reviews of their listings
   * @returns {object} JSON response with the updated review
   */
  respondToReview: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const hostId = req.user.id;
      const { response } = req.body;

      if (!response || response.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Response content is required'
        });
      }

      // Find the review and verify ownership
      const review = await db.Review.findByPk(reviewId, {
        include: [
          {
            model: db.Booking,
            as: 'booking',
            include: [
              {
                model: db.Listing,
                as: 'listing'
              }
            ]
          }
        ]
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found'
        });
      }

      // Check if the listing belongs to the host
      if (review.booking.listing.hostId !== hostId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized: This review is not for your listing'
        });
      }

      // Check if a response already exists
      const existingResponse = await db.ReviewResponse.findOne({
        where: { reviewId }
      });

      let reviewResponse;
      if (existingResponse) {
        // Update existing response
        reviewResponse = await existingResponse.update({
          content: response,
          editedAt: new Date(),
          editCount: existingResponse.editCount + 1
        });

        // Also update the review with the response content
        await review.update({
          response,
          responseDate: new Date()
        });
      } else {
        // Create new response
        reviewResponse = await db.ReviewResponse.create({
          reviewId,
          hostId,
          content: response
        });

        // Also update the review with the response date
        await review.update({
          response,
          responseDate: new Date()
        });
      }

      res.json({
        success: true,
        message: 'Response submitted successfully',
        data: reviewResponse
      });
    } catch (error) {
      console.error('Error responding to review:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to respond to review'
      });
    }
  },

  /**
   * Delete a response to a review
   * @route DELETE /api/reviews/:reviewId/respond
   * @access Private - Host only for their responses
   * @returns {object} JSON response with success message
   */
  deleteResponse: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const hostId = req.user.id;

      // Find the response and verify ownership
      const response = await db.ReviewResponse.findOne({
        where: { reviewId, hostId }
      });

      if (!response) {
        return res.status(404).json({
          success: false,
          error: 'Response not found or not owned by you'
        });
      }

      // Delete the response
      await response.destroy();

      // Also update the review to remove the response
      await db.Review.update(
        { response: null, responseDate: null },
        { where: { id: reviewId } }
      );

      res.json({
        success: true,
        message: 'Response deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting response:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete response'
      });
    }
  },

  /**
   * Toggle visibility of a review response
   * @route PATCH /api/reviews/:reviewId/respond/visibility
   * @access Private - Host only for their responses
   * @returns {object} JSON response with the updated response
   */
  toggleResponseVisibility: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const hostId = req.user.id;

      // Find the response and verify ownership
      const response = await db.ReviewResponse.findOne({
        where: { reviewId, hostId }
      });

      if (!response) {
        return res.status(404).json({
          success: false,
          error: 'Response not found or not owned by you'
        });
      }

      // Toggle visibility
      const updatedResponse = await response.toggleVisibility();

      res.json({
        success: true,
        message: `Response is now ${updatedResponse.isPublic ? 'public' : 'private'}`,
        data: updatedResponse
      });
    } catch (error) {
      console.error('Error toggling response visibility:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to toggle response visibility'
      });
    }
  },

  /**
   * Get all property types (useful for mapping propertyTypeId to names)
   * @route GET /api/reviews/property-types
   * @access Public
   * @returns {object} JSON response with property types
   */
  getPropertyTypes: async (req, res) => {
    try {
      const propertyTypes = await db.PropertyType.findAll({
        attributes: ['id', 'name', 'icon'],
        where: { isActive: true },
        order: [['name', 'ASC']]
      });
      
      res.json({
        success: true,
        data: propertyTypes
      });
    } catch (error) {
      console.error('Error fetching property types:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch property types'
      });
    }
  }
};

module.exports = reviewController; 