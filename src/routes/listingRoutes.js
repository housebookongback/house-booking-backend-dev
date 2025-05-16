const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { authenticate } = require('../middleware/authMiddleware');
const { uploadMultiple } = require('../middleware/upload');

// Step 1: Basic Information
router.get('/property-types', listingController.getPropertyTypes);
router.post('/draft', authenticate, listingController.createDraftListing);
// Add route for updating basic info
router.patch('/:listingId/basic-info', authenticate, listingController.updateBasicInfo);

// Step 2: Location
router.patch('/:listingId/location', authenticate, listingController.updateLocation);

// Step 3: Details
router.patch('/:listingId/details', authenticate, listingController.updateDetails);

// Step 4: Pricing
router.patch('/:listingId/pricing', authenticate, listingController.updatePricing);

// Step 5: Photos
router.patch('/:listingId/photos', authenticate, uploadMultiple, listingController.updatePhotos);

// Get all available amenities
router.get('/amenities', listingController.getAmenities);

// Amenities Update
router.patch('/:listingId/amenities', authenticate, listingController.updateAmenities);
router.patch('/:listingId/amenities-simple', authenticate, listingController.updateAmenitiesSimple);

// Step 6: Rules
router.patch('/:listingId/rules', authenticate, listingController.updateRules);
router.patch('/:listingId/rules-simple', authenticate, listingController.updateRulesSimple);

// Step 7: Calendar
router.patch('/:listingId/calendar', authenticate, listingController.updateCalendar);

// Step Status Management
router.patch('/:listingId/step-status', authenticate, listingController.updateStepStatus);
router.get('/:listingId/step-status', authenticate, listingController.getStepStatus);

// Final Step: Publish
router.patch('/:listingId/publish', authenticate, listingController.publishListing);

// Emergency path for force updating status when publish doesn't work
router.post('/:listingId/force-status-update', authenticate, async (req, res) => {
  try {
    const { listingId } = req.params;
    const { status, forceUpdate } = req.body;
    
    console.log(`EMERGENCY: Force updating listing ${listingId} status to ${status}, requested by user ${req.user?.id}`);
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    
    // Get database models
    const db = require('../models');
    const Listing = db.Listing;
    
    // Find the listing
    const listing = await Listing.findOne({
      where: {
        id: listingId,
        hostId: req.user.id
      }
    });
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found or you are not authorized'
      });
    }
    
    // Force update the status directly, bypassing normal validation
    await listing.update({ 
      status: status,
    }, {
      // Skip validation if forceUpdate is true
      validate: !forceUpdate 
    });
    
    res.json({
      success: true,
      message: `Listing status forcefully updated to ${status}`,
      data: {
        id: listing.id,
        status: status
      }
    });
  } catch (error) {
    console.error('Emergency status update failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to force update listing status',
      details: error.message
    });
  }
});

// Direct update endpoint for fallback
router.post('/:listingId/direct-update', authenticate, listingController.directUpdateListing);

// check availability for booking
router.get('/:listingId/availability',  listingController.getAvailability);

// get all listings
router.get('/', listingController.getAllListings);

// Utility route - schema check and fix (protect with admin auth later)
router.get('/admin/check-schema', listingController.checkAndFixSchema);

// get single listing by id
router.get('/:listingId', authenticate, listingController.getListingById);

// delete listing
router.delete('/:listingId', authenticate, listingController.deleteListing);

module.exports = router; 