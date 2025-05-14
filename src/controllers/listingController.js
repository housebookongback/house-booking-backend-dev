/**
 * 📝 Reminder for Final Step (Publishing Listing)
 * ------------------------------------------------
 * ✅ Once all listing steps are completed:
 *   - Basic Info
 *   - Location
 *   - Details
 *   - Pricing
 *   - Photos
 *   - Rules
 *   - Calendar
 *
 * 👉 Call the backend route: POST /api/listings/:listingId/publish
 *    - This will change status from 'draft' to 'published'
 *    - Model will run final validation (only works if all fields are completed)
 *
 * ⚠️ Do NOT manually set status to 'published' from frontend
 * ✅ Let backend handle it via publishListing controller
 */


const db = require('../models');
const PropertyType = db.PropertyType;
const Listing = db.Listing;
const Photo = db.Photo;
const { ValidationError } = require('sequelize');
const path = require('path');
const { Op } = require('sequelize');

const listingController = {
    // Public routes
    getAllListings: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'DESC',
                categoryId,
                locationId,
                minPrice,
                maxPrice,
                minRating,
                instantBookable
            } = req.query;

            // Build query options
            const queryOptions = {
                where: {
                    status: 'published',
                    isActive: true
                },
                include: [
                    {
                        model: db.Photo,
                        as: 'photos',
                        where: { isCover: true },
                        required: false
                    },
                    {
                        model: db.Location,
                        as: 'locationDetails',
                        attributes: ['id', 'name', 'slug']
                    },
                    {
                        model: db.Category,
                        as: 'category',
                        attributes: ['id', 'name', 'slug'],
                        required: false
                    }
                ],
                order: [[sortBy, sortOrder]],
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit)
            };

            // Add filters if provided
            if (categoryId) queryOptions.where.categoryId = categoryId;
            if (locationId) queryOptions.where.locationId = locationId;
            if (minPrice) queryOptions.where.pricePerNight = { [Op.gte]: minPrice };
            if (maxPrice) queryOptions.where.pricePerNight = { ...queryOptions.where.pricePerNight, [Op.lte]: maxPrice };
            if (minRating) queryOptions.where.averageRating = { [Op.gte]: minRating };
            if (instantBookable) queryOptions.where.instantBookable = instantBookable === 'true';

            // Get listings and total count
            const { count, rows: listings } = await Listing.findAndCountAll(queryOptions);

            res.json({
                success: true,
                data: {
                    listings,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(count / parseInt(limit))
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching listings:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch listings'
            });
        }
    },

    // Step 1: Basic Information
    getPropertyTypes: async (req, res) => {
        try {
            const propertyTypes = await PropertyType.findAll({
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
    },

    createDraftListing: async (req, res) => {
        try {
            const {
                title,
                description,
                propertyTypeId
            } = req.body;

            // Validate required fields
            if (!title || !description || !propertyTypeId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    details: {
                        title: !title ? 'Title is required' : null,
                        description: !description ? 'Description is required' : null,
                        propertyTypeId: !propertyTypeId ? 'Property type is required' : null
                    }
                });
            }

            // Validate title length
            if (title.length < 5 || title.length > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid title length',
                    details: {
                        title: 'Title must be between 5 and 100 characters'
                    }
                });
            }

            // Validate description length
            if (description.length < 10 || description.length > 5000) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid description length',
                    details: {
                        description: 'Description must be between 10 and 5000 characters'
                    }
                });
            }

            // Check if property type exists
            const propertyType = await PropertyType.findOne({
                where: { 
                    id: propertyTypeId,
                    isActive: true
                }
            });

            if (!propertyType) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid property type',
                    details: {
                        propertyTypeId: 'Selected property type does not exist'
                    }
                });
            }

            // Create the draft listing
            const listing = await Listing.create({
                title,
                description,
                propertyTypeId,
                hostId: req.user.id,
                status: 'draft',
                step: 1,
                stepStatus: {
                    basicInfo: true,
                    location: false,
                    details: false,
                    pricing: false,
                    photos: false,
                    rules: false,
                    calendar: false
                },
                isActive: true
            });

            res.status(201).json({
                success: true,
                message: 'Draft listing created successfully',
                data: {
                    id: listing.id,
                    title: listing.title,
                    description: listing.description,
                    propertyTypeId: listing.propertyTypeId,
                    status: listing.status,
                    step: listing.step,
                    stepStatus: listing.stepStatus,
                    createdAt: listing.createdAt
                }
            });
        } catch (error) {
            console.error('Error creating draft listing:', error);
            
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

            res.status(500).json({ 
                success: false,
                error: 'Failed to create draft listing' 
            });
        }
    },

    // Step 2: Location
    updateLocation: async (req, res) => {
        const { listingId } = req.params;
        const { address, coordinates } = req.body;

        // 1) Payload validation
        if (typeof address !== 'string' || !address.trim()) {
            return res.status(400).json({
                success: false,
                error: '`address` must be a non-empty string'
            });
        }
        if (
            typeof coordinates !== 'object' ||
            typeof coordinates.lat !== 'number' ||
            typeof coordinates.lng !== 'number'
        ) {
            return res.status(400).json({
                success: false,
                error: '`coordinates` must be an object with numeric `lat` and `lng`'
            });
        }

        try {
            // 2) Fetch & authorize the Draft
            const listing = await Listing.findOne({
                where: { id: listingId, hostId: req.user.id, status: 'draft' }
            });
            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not authorized'
                });
            }

            // 3) Atomic update with location creation
            await db.sequelize.transaction(async (t) => {
                             // (Optional) Create new Location record if you still need it
                               const location = await db.Location.create({
                                    name: address,
                                   description: `Location for listing ${listing.title}`,
                                    isActive: true
                                }, { transaction: t });
                
                                // Build the GeoJSON point your Listing model expects
                                const locationPoint = {
                                    type: 'Point',
                                    coordinates: [coordinates.lng, coordinates.lat]
                                };
                
                                // Update listing with the geometry column, plus any other fields
                               const currentStatus = listing.stepStatus || {};
                                await listing.update({
                                    locationId: location.id,     // if you still reference a Location table
                                    address,
                                    coordinates,                 // raw JSON fallback
                                    location: locationPoint,     // ← this satisfies validLocation()
                                    step: 2,
                                    stepStatus: { ...currentStatus, location: true }
                               }, { transaction: t });
                            });

            // 4) Respond with fresh state
            return res.json({
                success: true,
                message: 'Location updated successfully',
                data: {
                    id: listing.id,
                    locationId: listing.locationId,
                    address,
                    coordinates,
                    step: 2,
                    stepStatus: { ...listing.stepStatus, location: true }
                }
            });
        } catch (error) {
            console.error('Error updating location:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update location'
            });
        }
    },

    // Step 3: Details
    updateDetails: async (req, res) => {
        try {
            const { listingId } = req.params;
            const { bedrooms, bathrooms, beds, accommodates } = req.body;

            const listing = await Listing.findOne({
                where: {
                    id: listingId,
                    hostId: req.user.id,
                    status: 'draft'
                }
            });

            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not authorized'
                });
            }

            // Update details and mark step as complete
            await listing.update({
                bedrooms,
                bathrooms,
                beds,
                accommodates,
                step: 3,
                stepStatus: {
                    ...listing.stepStatus,
                    details: true
                }
            });

            res.json({
                success: true,
                message: 'Details updated successfully',
                data: {
                    id: listing.id,
                    step: listing.step,
                    stepStatus: listing.stepStatus
                }
            });
        } catch (error) {
            console.error('Error updating details:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update details'
            });
        }
    },

    // Step 4: Pricing
    updatePricing: async (req, res) => {
        try {
            const { listingId } = req.params;
            const { pricePerNight, cleaningFee, securityDeposit, minimumNights, maximumNights } = req.body;

            const listing = await Listing.findOne({
                where: {
                    id: listingId,
                    hostId: req.user.id,
                    status: 'draft'
                }
            });

            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not authorized'
                });
            }

            // Update pricing and mark step as complete
            await listing.update({
                pricePerNight,
                cleaningFee,
                securityDeposit,
                minimumNights,
                maximumNights,
                step: 4,
                stepStatus: {
                    ...listing.stepStatus,
                    pricing: true
                }
            });

            res.json({
                success: true,
                message: 'Pricing updated successfully',
                data: {
                    id: listing.id,
                    step: listing.step,
                    stepStatus: listing.stepStatus
                }
            });
        } catch (error) {
            console.error('Error updating pricing:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update pricing'
            });
        }
    },

    // Step 5: Photos
    updatePhotos: async (req, res) => {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No photos provided'
            });
        }

        try {
            console.log('Request body:', req.body);
            console.log('Request files:', req.files);
            console.log('Request headers:', req.headers);

            const { listingId } = req.params;
            const { isCover } = req.body;

            const listing = await Listing.findOne({
                where: {
                    id: listingId,
                    hostId: req.user.id,
                    status: 'draft'
                }
            });

            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not authorized'
                });
            }

            // Create photo records
            const photos = await Promise.all(files.map(async (file, index) => {
                const rawPath = file.path;
                const normalized = rawPath.split(path.sep).join('/');
                const publicUrl = `${req.protocol}://${req.get('host')}/${normalized}`;

                return Photo.create({
                    listingId: listing.id,
                    url: publicUrl,
                    fileType: file.mimetype,
                    fileSize: file.size,
                    isCover: index === 0, // First photo is cover
                    category: 'other',
                    displayOrder: index
                });
            }));

            // Update step status
            await listing.update({
                step: 5,
                stepStatus: {
                    ...listing.stepStatus,
                    photos: true
                }
            });

            res.json({
                success: true,
                message: 'Photos uploaded successfully',
                data: {
                    id: listing.id,
                    step: listing.step,
                    stepStatus: listing.stepStatus,
                    photos: photos.map(photo => ({
                        id: photo.id,
                        url: photo.url,
                        isCover: photo.isCover
                    }))
                }
            });
        } catch (error) {
            console.error('Error uploading photos:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload photos'
            });
        }
    },

    // Step 6: Rules
    updateRules: async (req, res) => {
        const { listingId } = req.params;
        const { rules } = req.body;

        // Basic payload check
        if (!Array.isArray(rules)) {
            return res.status(400).json({
                success: false,
                error: '`rules` must be an array'
            });
        }

        // Optionally enforce at least one rule
        // if (rules.length === 0) {
        //   return res.status(400).json({ success: false, error: 'At least one rule is required' });
        // }

        try {
            const listing = await Listing.findOne({
                where: {
                    id: listingId,
                    hostId: req.user.id,
                    status: 'draft'
                }
            });
            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not authorized'
                });
            }

            // Wrap destroy, bulkCreate and listing.update in a transaction
            await db.sequelize.transaction(async (t) => {
                // 1) remove old rules
                await db.PropertyRule.destroy({
                    where: { listingId: listing.id },
                    transaction: t
                });

                // 2) insert new ones (if any)
                if (rules.length) {
                    await db.PropertyRule.bulkCreate(
                        rules.map(rule => ({
                            ...rule,
                            listingId: listing.id
                        })),
                        { transaction: t }
                    );
                }

                // 3) mark step done
                const currentStatus = listing.stepStatus || {};
                await listing.update({
                    step: 6,
                    stepStatus: { ...currentStatus, rules: true }
                }, { transaction: t });
            });

            // fetch what's now in the DB so the client can sync
            const newRules = await db.PropertyRule.findAll({
                where: { listingId: listing.id }
            });

            return res.json({
                success: true,
                message: 'Rules updated successfully',
                data: {
                    id: listing.id,
                    step: 6,
                    stepStatus: { ...listing.stepStatus, rules: true },
                    rules: newRules
                }
            });
        } catch (error) {
            console.error('Error updating rules:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update rules'
            });
        }
    },

    // Step 7: Calendar
updateCalendar: async (req, res) => {
    const { listingId } = req.params;
    const { calendar } = req.body;
  
    // 1) Validate payload
    if (!Array.isArray(calendar)) {
      return res.status(400).json({
        success: false,
        error: '`calendar` must be an array of { date, isAvailable, price? }'
      });
    }
    for (const entry of calendar) {
      if (!entry.date || typeof entry.isAvailable !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Each calendar entry needs a `date` and boolean `isAvailable`'
        });
      }
    }
  
    try {
      // 2) Fetch & authorize draft
      const listing = await Listing.findOne({
        where: { id: listingId, hostId: req.user.id, status: 'draft' }
      });
      if (!listing) {
        return res.status(404).json({
          success: false,
          error: 'Listing not found or not authorized'
        });
      }
  
      // 3) In a transaction, wipe old and insert new dates, then bump step/status
      await db.sequelize.transaction(async (t) => {
        // a) remove any existing entries
        await db.BookingCalendar.destroy({
          where: { listingId },
          transaction: t
        });
  
        // b) bulk‐create the fresh ones
        await db.BookingCalendar.bulkCreate(
          calendar.map(({ date, isAvailable, price }) => ({
            listingId,
            date,               
            isAvailable,
            basePrice: price != null ? price : listing.pricePerNight,
            minStay: listing.minStay || 1,
            maxStay: listing.maxStay,
            checkInAllowed: true,
            checkOutAllowed: true
          })),
          { transaction: t }
        );
  
        // c) mark your listing step 7 done
        const currentStatus = listing.stepStatus || {};
        await listing.update({
          step: 7,
          stepStatus: { ...currentStatus, calendar: true }
        }, { transaction: t });
      });
  
      // 4) Fetch back what you just saved
      const newCalendar = await db.BookingCalendar.findAll({
        where: { listingId }
      });
  
      // 5) Return it for the client
      return res.json({
        success: true,
        message: 'Calendar updated successfully',
        data: {
          id: listing.id,
          step: 7,
          stepStatus: { ...listing.stepStatus, calendar: true },
          calendar: newCalendar
        }
      });
    } catch (error) {
      console.error('Error updating calendar:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update calendar'
      });
    }
  },
  

    // Step Status Management
    updateStepStatus: async (req, res) => {
        try {
            const { listingId } = req.params;
            const { step, stepStatus } = req.body;

            const listing = await Listing.findOne({
                where: {
                    id: listingId,
                    hostId: req.user.id,
                    status: 'draft'
                }
            });

            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not authorized'
                });
            }

            await listing.update({
                step,
                stepStatus
            });

            res.json({
                success: true,
                message: 'Step status updated successfully',
                data: {
                    id: listing.id,
                    step: listing.step,
                    stepStatus: listing.stepStatus
                }
            });
        } catch (error) {
            console.error('Error updating step status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update step status'
            });
        }
    },

    getStepStatus: async (req, res) => {
        try {
            const { listingId } = req.params;

            const listing = await Listing.findOne({
                where: {
                    id: listingId,
                    hostId: req.user.id
                },
                attributes: ['id', 'step', 'stepStatus', 'status']
            });

            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not authorized'
                });
            }

            res.json({
                success: true,
                data: {
                    id: listing.id,
                    step: listing.step,
                    stepStatus: listing.stepStatus,
                    status: listing.status
                }
            });
        } catch (error) {
            console.error('Error getting step status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get step status'
            });
        }
    },

    // Final Step: Publish
    publishListing: async (req, res) => {
        const { listingId } = req.params;
        console.log("listingId", listingId)
        console.log("req.user.id", req.user.id)
        try {
            console.log("z;f, erf;",Listing)
            const listing = await Listing.findOne({
                where: {
                    id: listingId,
                    hostId: req.user.id,
                    status: 'draft'
                }
            });
            console.log("listing", listing)
            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not authorized'
                });
            }

            // ✅ Safety check before evaluating stepStatus
            if (!listing.stepStatus || typeof listing.stepStatus !== 'object') {
                return res.status(400).json({
                    success: false,
                    error: `Listing step status is missing or malformed for listing ID ${listing.id}`
                });
            }

            // Check if all steps are complete
            const allStepsComplete = Object.values(listing.stepStatus).every(status => status === true);

            if (!allStepsComplete) {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot publish listing: all steps must be completed'
                });
            }

            // Publish the listing
            await listing.update({
                status: 'published'
            });

            res.json({
                success: true,
                message: 'Listing published successfully',
                data: {
                    id: listing.id,
                    status: listing.status
                }
            });
        } catch (error) {
            console.error('Error publishing listing:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to publish listing'
            });
        }
    },

    getAvailability: async (req, res) => {
        const { listingId } = req.params;
        const { startDate, endDate, numberOfGuests } = req.query;

        // Validate query parameters
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'startDate and endDate are required'
            });
        }

        try {
            // Get the listing
            const listing = await Listing.findOne({
                where: { id: listingId, status: 'published' }
            });

            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found'
                });
            }

            // Calculate the number of nights requested
            const start = new Date(startDate);
            const end = new Date(endDate);
            const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

            // Check if the requested stay is within limits
            if (nights < listing.minimumNights) {
                return res.status(400).json({
                    success: false,
                    error: `Minimum stay is ${listing.minimumNights} nights`
                });
            }

            if (nights > listing.maximumNights) {
                return res.status(400).json({
                    success: false,
                    error: `Maximum stay is ${listing.maximumNights} nights`
                });
            }

            // Get calendar entries for the date range
            const calendarEntries = await db.BookingCalendar.findAll({
                where: {
                    listingId,
                    date: {
                        [Op.between]: [startDate, endDate]
                    }
                },
                include: [{
                    model: db.PriceRule,
                    as: 'priceRules',
                    where: {
                        isActive: true,
                        startDate: { [Op.lte]: db.sequelize.col('BookingCalendar.date') },
                        endDate: { [Op.gte]: db.sequelize.col('BookingCalendar.date') }
                    },
                    order: [['priority', 'DESC']]
                }]
            });

            // Generate all dates in the range
            const dates = [];
            const currentDate = new Date(startDate);
            const endDateObj = new Date(endDate);
            
            while (currentDate <= endDateObj) {
                dates.push(new Date(currentDate));
                currentDate.setDate(currentDate.getDate() + 1);
            }

            // Create a map of existing calendar entries
            const calendarMap = new Map(
                calendarEntries.map(entry => [entry.date.toISOString().split('T')[0], entry])
            );

            // Check availability and calculate prices for all dates
            const availability = await Promise.all(dates.map(async (date) => {
                const dateStr = date.toISOString().split('T')[0];
                const entry = calendarMap.get(dateStr);

                if (entry) {
                    // Check date-specific stay limits
                    if (nights < entry.minStay) {
                        return {
                            date: dateStr,
                            isAvailable: false,
                            error: `Minimum stay for this date is ${entry.minStay} nights`
                        };
                    }
                    if (entry.maxStay && nights > entry.maxStay) {
                        return {
                            date: dateStr,
                            isAvailable: false,
                            error: `Maximum stay for this date is ${entry.maxStay} nights`
                        };
                    }

                    // Use existing calendar entry
                    const finalPrice = await entry.getFinalPrice();
                    return {
                        date: dateStr,
                        isAvailable: entry.isAvailable,
                        basePrice: entry.basePrice,
                        finalPrice,
                        minStay: entry.minStay,
                        maxStay: entry.maxStay,
                        checkInAllowed: entry.checkInAllowed,
                        checkOutAllowed: entry.checkOutAllowed
                    };
                } else {
                    // Use listing defaults
                    return {
                        date: dateStr,
                        isAvailable: listing.defaultAvailability,
                        basePrice: listing.pricePerNight,
                        finalPrice: listing.pricePerNight,
                        minStay: listing.minimumNights,
                        maxStay: listing.maximumNights,
                        checkInAllowed: listing.checkInDays.includes(date.getDay()),
                        checkOutAllowed: listing.checkOutDays.includes(date.getDay())
                    };
                }
            }));

            return res.json({
                success: true,
                data: {
                    listingId,
                    startDate,
                    endDate,
                    availability
                }
            });
        } catch (error) {
            console.error('Error checking availability:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to check availability'
            });
        }
    }
};

module.exports = listingController;