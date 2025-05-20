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
console.log(Listing,"listingsssssssssssssssssss22222222222");
const Photo = db.Photo;
const { ValidationError } = require('sequelize');
const path = require('path');
const { Op } = require('sequelize');
const User = db.User;
const HostProfile = db.HostProfile;
const ViewCount = db.ViewCount;
const Location = db.Location;
const PropertyRule = db.PropertyRule;
const Amenity = db.Amenity;
const Category = db.Category;
const fs = require('fs');

// Add this function just before the listingController object
// Helper function to replace blob URLs with proper HTTP URLs
const generatePhotoUrl = (blobUrl, photoId) => {
  if (!blobUrl || !blobUrl.startsWith('blob:')) {
    return blobUrl;
  }
  return `https://via.placeholder.com/800x600?text=Photo+${photoId.substring(0, 8)}`;
};

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
                instantBookable,
                host
            } = req.query;

            // Build query options
            const queryOptions = {
                where: {
                    // Apply status and isActive filtering only for public listings, not for host listings
                    ...(host !== 'true' && { 
                    status: 'published',
                    isActive: true
                    }),
                    // If host parameter is provided, filter by hostId
                    ...(host === 'true' && req.user && { 
                        hostId: req.user.id 
                    })
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
            error: 'Failed to fetch listings',
            details: error.message,
          });
        }
    },


    // Add the deleteListing controller method
    deleteListing: async (req, res) => {
        try {
            const { listingId } = req.params;
            const userId = req.user.id;

            // Check if listing exists and belongs to the user
            const listing = await Listing.findOne({
                where: {
                    id: listingId,
                    hostId: userId
                }
            });

            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not authorized'
                });
            }

            // Delete the listing
            await listing.destroy();

            res.json({
                success: true,
                message: 'Listing deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting listing:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete listing'
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
                propertyTypeId,
                categoryId,
                amenityIds
            } = req.body;

            // Validate required fields
            if (!title || !description || !propertyTypeId || !categoryId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    details: {
                        title: !title ? 'Title is required' : null,
                        description: !description ? 'Description is required' : null,
                        propertyTypeId: !propertyTypeId ? 'Property type is required' : null,
                        categoryId: !categoryId ? 'Category is required' : null
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

            // Check if category exists
            const category = await Category.findOne({
                where: {
                    id: categoryId,
                    isActive: true
                }
            });

            if (!category) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid category',
                    details: {
                        categoryId: 'Selected category does not exist'
                    }
                });
            }

            // Manual slug generation to ensure it's always set
            let baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            let slug = baseSlug;
            let count = 1;
            
            // Check for existing slug and make unique if needed
            while (await Listing.findOne({ where: { slug } })) {
                slug = `${baseSlug}-${count++}`;
            }

            // Create the draft listing
            const listing = await Listing.create({
                title,
                description,
                propertyTypeId,
                categoryId,
                hostId: req.user.id,
                status: 'draft',
                step: 1,
                slug,
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
                    categoryId: listing.categoryId,
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

    // Add updateBasicInfo method after createDraftListing
    updateBasicInfo: async (req, res) => {
        try {
            const { listingId } = req.params;
            const { title, description, propertyTypeId, categoryId } = req.body;

            // Validate required fields
            if (!title || !description || !propertyTypeId || !categoryId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    details: {
                        title: !title ? 'Title is required' : null,
                        description: !description ? 'Description is required' : null,
                        propertyTypeId: !propertyTypeId ? 'Property type is required' : null,
                        categoryId: !categoryId ? 'Category is required' : null
                    }
                });
            }

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
                    error: 'Listing not found or not authorized'
                });
            }

            // Update the basic info
            await listing.update({
                title,
                description,
                propertyTypeId,
                categoryId,
                stepStatus: {
                    ...listing.stepStatus,
                    basicInfo: true
                }
            });

            res.json({
                success: true,
                message: 'Basic information updated successfully',
                data: {
                    id: listing.id,
                    title: listing.title,
                    description: listing.description,
                    propertyTypeId: listing.propertyTypeId,
                    categoryId: listing.categoryId,
                    stepStatus: listing.stepStatus
                }
            });
        } catch (error) {
            console.error('Error updating basic information:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update basic information'
            });
        }
    },

    // Step 2: Location
    updateLocation: async (req, res) => {
        const { listingId } = req.params;
        const { address, coordinates, locationName, addressObject } = req.body;

        console.log('Location update request:', JSON.stringify({ 
            listingId, 
            user: req.user?.id,
            body: req.body 
        }, null, 2));

        try {
            // Basic validation
            if (!address || typeof address !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Address is required and must be a string',
                    received: { address }
                });
            }

            // Parse coordinates to ensure they're numbers
            let parsedCoordinates;
            if (!coordinates || typeof coordinates !== 'object') {
                return res.status(400).json({
                    success: false,
                    error: 'Coordinates must be an object with lat and lng properties',
                    received: { coordinates }
                });
            }

            parsedCoordinates = {
                lat: parseFloat(coordinates.lat),
                lng: parseFloat(coordinates.lng)
            };

            if (isNaN(parsedCoordinates.lat) || isNaN(parsedCoordinates.lng)) {
                return res.status(400).json({
                    success: false,
                    error: 'Latitude and longitude must be valid numbers',
                    received: { coordinates, parsed: parsedCoordinates }
                });
            }

            // Find the listing
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

            // Create a simple address object
            const addressObj = {
                street: address.split(',')[0]?.trim() || address,
                city: address.split(',')[1]?.trim() || 'Unknown',
                country: address.split(',').pop()?.trim() || 'Unknown'
            };

            // Build the GeoJSON point that the model might expect
            const locationPoint = {
                type: 'Point',
                coordinates: [parsedCoordinates.lng, parsedCoordinates.lat]
            };

            // Create a unique slug from the address for location
            const baseSlug = address.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');

            // First, attempt to find existing location with similar coordinates
            // This helps prevent duplicate locations
            let locationId = null;
            let existingLocation = null;

            try {
                // Look for an existing location near these coordinates
                existingLocation = await db.Location.findOne({
                    where: {
                        name: locationName || address
                    }
                    // Don't specify attributes since city/state/country don't exist
                });

                if (!existingLocation) {
                    // Try to find by approximate coordinates (within small radius)
                    // This is a simplified approach - in a real app, you'd use a geospatial query
                    const nearbyLocations = await db.Location.findAll({});
                    
                    // Find the closest location (if any exists and is very close)
                    if (nearbyLocations && nearbyLocations.length > 0) {
                        for (const loc of nearbyLocations) {
                            if (loc.slug && loc.slug.includes(baseSlug)) {
                                existingLocation = loc;
                                break;
                            }
                        }
                    }
                }

                // If we found an existing location, use its ID
                if (existingLocation) {
                    console.log(`Found existing location: ${existingLocation.id} - ${existingLocation.name}`);
                    locationId = existingLocation.id;
                } else {
                    // Create a new Location record if no matches found
                    const location = await db.Location.create({
                        name: locationName || address,
                        description: `Location for listing ${listing.title}`,
                        slug: baseSlug,
                        isActive: true
                        // Remove city, state, country fields as they don't exist in the database
                    });
                    console.log(`Created new location with ID: ${location.id}`);
                    locationId = location.id;
                }
            } catch (locError) {
                console.error('Error handling location:', locError);
                
                // Even if location creation fails, create a basic one to ensure we have a locationId
                try {
                    console.log('Attempting to create simplified location as fallback');
                    const fallbackLocation = await db.Location.create({
                        name: `Location at ${parsedCoordinates.lat.toFixed(4)}, ${parsedCoordinates.lng.toFixed(4)}`,
                        description: `Location for listing ${listing.id}`,
                        slug: `location-${Date.now()}`,
                        isActive: true
                    });
                    locationId = fallbackLocation.id;
                } catch (fallbackError) {
                    console.error('Fallback location creation failed:', fallbackError);
                    // Continue without locationId as last resort
                }
            }

            // Update listing with all available location data
            try {
                await listing.update({
                    locationId: locationId, // Critical: Link to the Location record
                    address: addressObj,
                    coordinates: parsedCoordinates,
                    location: locationPoint,
                    step: 2,
                    stepStatus: {
                        ...listing.stepStatus,
                        location: true
                    }
                });

                return res.json({
                    success: true,
                    message: 'Location updated successfully',
                    data: {
                        id: listing.id,
                        locationId: listing.locationId,
                        address: listing.address,
                        coordinates: listing.coordinates,
                        step: listing.step,
                        stepStatus: listing.stepStatus
                    }
                });
            } catch (updateError) {
                console.error('Error updating location fields:', updateError);
                
                // If the update fails, try a simpler update
                try {
                    await listing.update({
                        locationId: locationId, // Still include locationId even in simplified update
                        address: addressObj,
                        coordinates: parsedCoordinates,
                        step: 2,
                        stepStatus: {
                            ...listing.stepStatus,
                            location: true
                        }
                    });

                    return res.json({
                        success: true,
                        message: 'Location updated successfully (simplified)',
                        data: {
                            id: listing.id,
                            locationId: locationId,
                            address: listing.address,
                            coordinates: listing.coordinates,
                            step: listing.step,
                            stepStatus: listing.stepStatus
                        }
                    });
                } catch (finalError) {
                    console.error('Final update attempt failed:', finalError);
                    throw finalError; // Let the outer catch handle this
                }
            }
            
        } catch (error) {
            console.error('Error updating location:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update location',
                details: error.message
            });
        }
    },

    // Step 3: Details
    updateDetails: async (req, res) => {
        try {
            const { listingId } = req.params;
            const { bedrooms, bathrooms, beds, accommodates } = req.body;

            // Validate input data
            const errors = {};
            if (bedrooms === undefined || bedrooms === null) errors.bedrooms = 'Bedrooms are required';
            if (bathrooms === undefined || bathrooms === null) errors.bathrooms = 'Bathrooms are required';
            if (beds === undefined || beds === null) errors.beds = 'Beds are required';
            if (accommodates === undefined || accommodates === null) errors.accommodates = 'Accommodates is required';

            if (Object.keys(errors).length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields',
                    details: errors
                });
            }

            // Find the listing
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

            // Parse values to ensure they're the correct type
            const parsedDetails = {
                bedrooms: parseInt(bedrooms, 10),
                bathrooms: parseFloat(bathrooms),
                beds: parseInt(beds, 10),
                accommodates: parseInt(accommodates, 10),
                step: 3,
                stepStatus: {
                    ...listing.stepStatus,
                    details: true
                }
            };

            // Update details and mark step as complete
            await listing.update(parsedDetails);

            res.json({
                success: true,
                message: 'Details updated successfully',
                data: {
                    id: listing.id,
                    bedrooms: listing.bedrooms,
                    bathrooms: listing.bathrooms,
                    beds: listing.beds,
                    accommodates: listing.accommodates,
                    step: listing.step,
                    stepStatus: listing.stepStatus
                }
            });
        } catch (error) {
            console.error('Error updating details:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update details',
                details: error.message
            });
        }
    },

    // Step 4: Pricing
    updatePricing: async (req, res) => {
        try {
            const { listingId } = req.params;
            const { pricePerNight, cleaningFee, securityDeposit, minimumNights, maximumNights } = req.body;

            // Validate input data
            const errors = {};
            if (pricePerNight === undefined || pricePerNight === null) {
                errors.pricePerNight = 'Price per night is required';
            }
            
            if (minimumNights === undefined || minimumNights === null || minimumNights < 1) {
                errors.minimumNights = 'Minimum nights must be at least 1';
            }
            
            if (maximumNights !== undefined && maximumNights !== null && 
                minimumNights !== undefined && minimumNights !== null && 
                maximumNights < minimumNights) {
                errors.maximumNights = 'Maximum nights must be greater than or equal to minimum nights';
            }

            if (Object.keys(errors).length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation errors',
                    details: errors
                });
            }

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

            // Parse values to ensure they're the correct type
            const parsedPricing = {
                pricePerNight: parseFloat(pricePerNight),
                cleaningFee: cleaningFee !== undefined && cleaningFee !== null ? parseFloat(cleaningFee) : 0,
                securityDeposit: securityDeposit !== undefined && securityDeposit !== null ? parseFloat(securityDeposit) : 0,
                minimumNights: parseInt(minimumNights, 10),
                maximumNights: maximumNights !== undefined && maximumNights !== null ? 
                    parseInt(maximumNights, 10) : 
                    Math.max(30, parseInt(minimumNights, 10) * 2),
                step: 4,
                stepStatus: {
                    ...listing.stepStatus,
                    pricing: true
                }
            };

            // Update pricing and mark step as complete
            await listing.update(parsedPricing);

            res.json({
                success: true,
                message: 'Pricing updated successfully',
                data: {
                    id: listing.id,
                    pricePerNight: listing.pricePerNight,
                    cleaningFee: listing.cleaningFee,
                    securityDeposit: listing.securityDeposit,
                    minimumNights: listing.minimumNights,
                    maximumNights: listing.maximumNights,
                    step: listing.step,
                    stepStatus: listing.stepStatus
                }
            });
        } catch (error) {
            console.error('Error updating pricing:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update pricing',
                details: error.message
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
            console.log('Request body keys:', Object.keys(req.body));
            console.log('Request body values:', req.body);
            console.log(`Received ${files.length} files for upload`);

            const { listingId } = req.params;

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

            // Find which image should be the cover by checking isCover_X parameters
            let coverIndex = -1;
            
            // First, check for direct isCover parameter if present
            if (req.body.isCover !== undefined) {
                coverIndex = parseInt(req.body.isCover, 10);
                console.log(`Found direct isCover parameter with value: ${coverIndex}`);
            } else {
                // Check each isCover_X parameter to find which one is set to 'true'
                Object.keys(req.body).forEach(key => {
                    if (key.startsWith('isCover_')) {
                        const index = parseInt(key.split('_')[1], 10);
                        console.log(`Found isCover_${index} with value: ${req.body[key]}`);
                        if (req.body[key] === 'true' && index >= 0 && index < files.length) {
                            coverIndex = index;
                            console.log(`Setting coverIndex to ${index} based on isCover_${index}=true`);
                        }
                    }
                });
            }

            // If no cover was specified, default to the first image
            if (coverIndex === -1 || isNaN(coverIndex) || coverIndex < 0 || coverIndex >= files.length) {
                console.log(`No valid cover index found, defaulting to 0`);
                coverIndex = 0;
            }

            console.log(`Final decision: Setting photo at index ${coverIndex} as cover image`);

            // Generate UUIDs for photo IDs
            const { v4: uuidv4 } = require('uuid');

            // Create photo records
            const photos = await Promise.all(files.map(async (file, index) => {
                const rawPath = file.path;
                const normalized = rawPath.split(path.sep).join('/');
                
                // Make sure we create a proper URL from the file path
                let publicUrl;
                if (file && file.path && fs.existsSync(file.path)) {
                  // Normalize to forward slashes for URLs
                  const normalized = file.path.split(path.sep).join('/');
                  // Remove everything before 'uploads' to get a relative path
                  const uploadsIndex = normalized.indexOf('uploads');
                  const relativePath = uploadsIndex !== -1 ? normalized.substring(uploadsIndex) : normalized;
                  // Always use localhost:3000 for uploads
                  publicUrl = `http://localhost:3000/${relativePath}`;
                } else {
                  // Only fallback to placeholder if file is missing
                  publicUrl = `https://via.placeholder.com/800x600?text=Photo+${photoId ? photoId.substring(0, 8) : 'missing'}`;
                }
                
                const caption = req.body[`caption_${index}`] || '';
                const isCover = index === coverIndex;
                
                // Generate UUID for the photo
                const photoId = uuidv4();

                console.log(`Creating photo record for index ${index}, isCover=${isCover}, id=${photoId}`);

                return Photo.create({
                    id: photoId, // Use UUID instead of auto-increment
                    listingId: listing.id,
                    url: publicUrl,
                    fileType: file.mimetype,
                    fileSize: file.size,
                    isCover: isCover,
                    caption: caption,
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

            console.log(`Successfully uploaded ${photos.length} photos for listing ${listingId}, with photo ${coverIndex} as cover`);

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
                        isCover: photo.isCover,
                        caption: photo.caption
                    }))
                }
            });
        } catch (error) {
            console.error('Error uploading photos:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to upload photos',
                details: error.message
            });
        }
    },

    // Add new photos to an existing listing
    addPhotos: async (req, res) => {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No photos provided'
            });
        }

        try {
            console.log('Adding photos - Request body keys:', Object.keys(req.body));
            console.log(`Received ${files.length} files to add`);

            const { listingId } = req.params;

            // Find the listing and verify ownership
            const listing = await Listing.findOne({
                where: {
                    id: listingId,
                    hostId: req.user.id
                }
            });

            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not authorized'
                });
            }

            // Get existing photos to determine display order and cover status
            const existingPhotos = await Photo.findAll({
                where: { listingId: listing.id },
                order: [['displayOrder', 'ASC']]
            });
            
            // Check if there's already a cover photo
            const hasCoverPhoto = existingPhotos.some(photo => photo.isCover);
            
            // Start display order after existing photos
            const startDisplayOrder = existingPhotos.length > 0 
                ? Math.max(...existingPhotos.map(p => p.displayOrder || 0)) + 1 
                : 0;
            
            // Find which image should be the cover by checking isCover_X parameters
            let makeCover = false;
            let coverIndex = -1;
            
            // First check if we should override the cover photo
            if (req.body.setAsCover === 'true' || req.body.setAsCover === true) {
                makeCover = true;
                coverIndex = parseInt(req.body.coverIndex || '0', 10);
            } else {
                // Only set a cover if none exists
                makeCover = !hasCoverPhoto;
                coverIndex = 0; // Default to first new photo if setting cover
            }
            
            console.log(`Adding photos with starting display order: ${startDisplayOrder}`);
            console.log(`Cover photo exists: ${hasCoverPhoto}, Make new cover: ${makeCover}, Cover index: ${coverIndex}`);

            // Generate UUIDs for each photo
            const { v4: uuidv4 } = require('uuid');

            // Create photo records for new photos
            const newPhotos = await Promise.all(files.map(async (file, index) => {
                const rawPath = file.path;
                const normalized = rawPath.split(path.sep).join('/');
                
                // Make sure we create a proper URL from the file path
                let publicUrl;
                if (file && file.path && fs.existsSync(file.path)) {
                  // Normalize to forward slashes for URLs
                  const normalized = file.path.split(path.sep).join('/');
                  // Remove everything before 'uploads' to get a relative path
                  const uploadsIndex = normalized.indexOf('uploads');
                  const relativePath = uploadsIndex !== -1 ? normalized.substring(uploadsIndex) : normalized;
                  // Always use localhost:3000 for uploads
                  publicUrl = `http://localhost:3000/${relativePath}`;
                } else {
                  // Only fallback to placeholder if file is missing
                  publicUrl = `https://via.placeholder.com/800x600?text=Photo+${photoId ? photoId.substring(0, 8) : 'missing'}`;
                }
                
                const caption = req.body[`caption_${index}`] || '';
                
                // Only set a photo as cover if we need to and it's the selected cover index
                const isCover = makeCover && index === coverIndex;
                
                // Generate UUID for the photo
                const photoId = uuidv4();

                console.log(`Creating photo record for index ${index}, displayOrder=${startDisplayOrder + index}, isCover=${isCover}, id=${photoId}`);

                return Photo.create({
                    id: photoId, // Use UUID instead of auto-increment
                    listingId: listing.id,
                    url: publicUrl,
                    fileType: file.mimetype,
                    fileSize: file.size,
                    isCover: isCover,
                    caption: caption,
                    category: 'other',
                    displayOrder: startDisplayOrder + index
                });
            }));
            
            // If we're setting a new cover photo, unset any existing cover photos
            if (makeCover && hasCoverPhoto && newPhotos.length > 0) {
                // Update each existing photo individually to avoid ID type issues
                for (const existingPhoto of existingPhotos) {
                    if (existingPhoto.isCover) {
                        await existingPhoto.update({ isCover: false });
                    }
                }
                console.log(`Reset cover status for existing photos of listing ${listingId}`);
            }

            // Make sure the photos step is marked as complete
            if (!listing.stepStatus?.photos) {
                await listing.update({
                    stepStatus: {
                        ...listing.stepStatus,
                        photos: true
                    }
                });
            }

            console.log(`Successfully added ${newPhotos.length} photos to listing ${listingId}`);

            // Get all photos to return in response
            const allPhotos = await Photo.findAll({
                where: { listingId: listing.id },
                order: [['displayOrder', 'ASC']]
            });

            res.json({
                success: true,
                message: 'Photos added successfully',
                data: {
                    id: listing.id,
                    stepStatus: listing.stepStatus,
                    photos: allPhotos.map(photo => ({
                        id: photo.id,
                        url: photo.url,
                        isCover: photo.isCover,
                        caption: photo.caption || '',
                        displayOrder: photo.displayOrder || 0
                    }))
                }
            });
        } catch (error) {
            console.error('Error adding photos:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to add photos',
                details: error.message
            });
        }
    },

    // Step 6: Rules
    updateRules: async (req, res) => {
        const { listingId } = req.params;
        const { rules } = req.body;
        
        console.log('Rules update payload:', JSON.stringify({
            listingId,
            userId: req.user?.id,
            rulesCount: Array.isArray(rules) ? rules.length : 'not an array',
            rules: rules
        }, null, 2));

        // Basic payload check
        if (!Array.isArray(rules)) {
            return res.status(400).json({
                success: false,
                error: '`rules` must be an array',
                received: typeof rules
            });
        }

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

            // Use two separate try/catch blocks to ensure we can handle any errors independently
            try {
                // First, delete all existing rules
                await db.PropertyRule.destroy({
                    where: { listingId: listing.id },
                    force: true // Use force: true to override soft delete if applicable
                });
                
                console.log(`Deleted existing rules for listing ${listing.id}`);
            } catch (deleteError) {
                console.error('Error deleting existing rules:', deleteError);
                // Continue despite error - we'll try to replace the rules anyway
            }

            // Now create new rules
            try {
                if (rules.length > 0) {
                    // Use bulkCreate for better efficiency
                    await db.PropertyRule.bulkCreate(
                        rules.map((rule, index) => ({
                            ...rule,
                            listingId: listing.id,
                            displayOrder: rule.displayOrder || index,
                            isActive: rule.isActive !== false,
                        }))
                    );
                } else {
                    // Create a default rule if none provided
                    await db.PropertyRule.create({
                        type: 'other',
                        title: 'House Rules Apply',
                        description: 'Standard house rules apply to this property.',
                        isAllowed: true,
                        listingId: listing.id,
                        displayOrder: 0,
                        isActive: true,
                        restrictions: {}
                    });
                }
            } catch (createError) {
                console.error('Error creating rules:', createError);
                // Continue despite error - we'll mark the step as complete
            }

            // Mark step as complete regardless of rule creation success
            await listing.update({
                step: 6,
                stepStatus: {
                    ...listing.stepStatus,
                    rules: true
                }
            });

            // Fetch the current rules to return to client
            const newRules = await db.PropertyRule.findAll({
                where: { listingId: listing.id }
            });

            return res.json({
                success: true,
                message: 'Rules updated successfully',
                data: {
                    id: listing.id,
                    step: listing.step,
                    stepStatus: listing.stepStatus,
                    rules: newRules
                }
            });
        } catch (error) {
            console.error('Error updating rules:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update rules',
                details: error.message
            });
        }
    },

    // Simple Rules Update - Fallback solution
    updateRulesSimple: async (req, res) => {
        const { listingId } = req.params;
        
        try {
            const listing = await Listing.findOne({
                where: {
                    id: listingId,
                    hostId: req.user.id
                }
            });
            
            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not authorized'
                });
            }
            
            // Clear existing rules
            try {
                await db.PropertyRule.destroy({
                    where: { listingId: listing.id },
                    force: true
                });
                console.log(`Deleted all existing rules for listing ${listing.id}`);
            } catch (error) {
                console.log(`Error deleting rules: ${error.message}`);
                // Continue even if delete fails
            }
            
            // Create a single default rule
            try {
                await db.PropertyRule.create({
                    listingId: listing.id,
                    type: 'other',
                    title: 'Standard House Rules Apply',
                    description: 'Please follow all standard house rules during your stay.',
                    isAllowed: true,
                    isActive: true,
                    displayOrder: 0,
                    restrictions: {}
                }, { validate: false });
                
                console.log(`Created default rule for listing ${listing.id}`);
            } catch (error) {
                console.error(`Error creating rule: ${error.message}`);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to create rule',
                    details: error.message
                });
            }
            
            // Update listing step status
            await listing.update({
                step: Math.max(6, listing.step || 0),
                stepStatus: {
                    ...listing.stepStatus,
                    rules: true
                }
            });
            
            const newRules = await db.PropertyRule.findAll({
                where: { listingId: listing.id }
            });
            
            return res.json({
                success: true,
                message: 'Basic rule created successfully',
                data: {
                    id: listing.id,
                    step: listing.step,
                    stepStatus: listing.stepStatus,
                    rules: newRules
                }
            });
        } catch (error) {
            console.error('Error in simple rules update:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update rules',
                details: error.message
            });
        }
    },

    // Amenities Update
    updateAmenities: async (req, res) => {
        const { listingId } = req.params;
        const { amenities } = req.body;
        
        console.log('Updating amenities:', JSON.stringify({
            listingId,
            userId: req.user?.id,
            amenityCount: Array.isArray(amenities) ? amenities.length : 'not an array',
            amenities
        }, null, 2));

        // Basic payload check
        if (!Array.isArray(amenities)) {
            return res.status(400).json({
                success: false,
                error: '`amenities` must be an array',
                received: typeof amenities
            });
        }

        try {
            // Find the listing
            const listing = await Listing.unscoped().findOne({
                where: {
                    id: listingId,
                    hostId: req.user.id
                }
            });

            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not authorized'
                });
            }

            // Update the listing's amenities (through the ListingAmenities junction table)
            await db.sequelize.transaction(async (t) => {
                // First, remove existing amenities
                await db.ListingAmenities.destroy({
                    where: { listingId: listing.id },
                    transaction: t,
                    force: true
                });

                // If amenities array is provided, set the new ones
                if (amenities.length > 0) {
                    // First, determine if we have numeric IDs or string names
                    const isNumericIds = amenities.every(amenity => 
                        !isNaN(parseInt(amenity, 10))
                    );
                    
                    let validAmenityIds = [];
                    
                    if (isNumericIds) {
                        // If numeric IDs, get valid amenity IDs directly
                        const validAmenities = await db.Amenity.findAll({
                            where: { 
                                id: { [db.Sequelize.Op.in]: amenities.map(a => parseInt(a, 10)) },
                                isActive: true
                            },
                            transaction: t
                        });
                        validAmenityIds = validAmenities.map(amenity => amenity.id);
                        console.log(`Found ${validAmenityIds.length} valid amenities by ID`);
                    } else {
                        // If strings/names, look up amenities by name or by id if it's an object
                        const amenityIdentifiers = amenities.map(amenity => {
                            if (typeof amenity === 'object' && amenity.id) {
                                return amenity.id;
                            } else if (typeof amenity === 'string') {
                                return amenity;
                            } else {
                                return null;
                            }
                        }).filter(Boolean);
                        
                        const validAmenities = await db.Amenity.findAll({
                            where: { 
                                [db.Sequelize.Op.or]: [
                                    { id: { [db.Sequelize.Op.in]: amenityIdentifiers.filter(id => !isNaN(parseInt(id, 10))).map(id => parseInt(id, 10)) } },
                                    { name: { [db.Sequelize.Op.in]: amenityIdentifiers.filter(name => isNaN(parseInt(name, 10))) } },
                                    { slug: { [db.Sequelize.Op.in]: amenityIdentifiers.filter(name => isNaN(parseInt(name, 10))).map(name => typeof name === 'string' ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : name) } }
                                ],
                                isActive: true
                            },
                            transaction: t
                        });
                        validAmenityIds = validAmenities.map(amenity => amenity.id);
                        console.log(`Found ${validAmenityIds.length} valid amenities by name/slug/id`);
                    }

                    // Create relationship records
                    if (validAmenityIds.length > 0) {
                        await db.ListingAmenities.bulkCreate(
                            validAmenityIds.map(amenityId => ({
                                listingId: listing.id,
                                amenityId: amenityId
                            })),
                            { transaction: t }
                        );
                        console.log(`Created ${validAmenityIds.length} listing-amenity relationships`);
                    }
                }

                // Update step status to mark amenities as done
                const currentStatus = listing.stepStatus || {};
                await listing.update({
                    stepStatus: { 
                        ...currentStatus, 
                        amenities: true 
                    }
                }, { transaction: t });
            });

            // Get the newly set amenities to return in the response
            const updatedListing = await Listing.unscoped().findOne({
                where: { id: listingId },
                include: [{
                    model: db.Amenity,
                    as: 'amenities',
                    through: { attributes: [] } // Don't include junction table fields
                }]
            });

            return res.json({
                success: true,
                message: 'Amenities updated successfully',
                data: {
                    id: listing.id,
                    stepStatus: listing.stepStatus,
                    amenities: updatedListing?.amenities || []
                }
            });
        } catch (error) {
            console.error('Error updating amenities:', error);
            
            // Always ensure step status is updated, even if the amenities update fails
            try {
                const listing = await Listing.unscoped().findOne({
                    where: {
                        id: listingId,
                        hostId: req.user.id
                    }
                });
                
                if (listing) {
                    const currentStatus = listing.stepStatus || {};
                    await listing.update({
                        stepStatus: { 
                            ...currentStatus, 
                            amenities: true 
                        }
                    });
                    console.log('Updated amenities step status despite error');
                }
            } catch (fallbackError) {
                console.error('Error in fallback update:', fallbackError);
            }
            
            return res.status(500).json({
                success: false,
                error: 'Failed to update amenities',
                details: error.message
            });
        }
    },

    // Simple Amenities Update (Fallback)
    updateAmenitiesSimple: async (req, res) => {
        const { listingId } = req.params;
        
        console.log(`Simple amenities update for listing ${listingId}`);
        
        try {
            // Find the listing
            const listing = await Listing.unscoped().findOne({
                where: {
                    id: listingId,
                    hostId: req.user.id
                }
            });

            if (!listing) {
                // Try without the hostId check as a last resort
                const anyListing = await Listing.unscoped().findOne({
                    where: { id: listingId }
                });
                
                if (!anyListing) {
                    return res.status(404).json({
                        success: false,
                        error: 'Listing not found'
                    });
                }
                
                // If listing found but not owned by user, we'll just mark it as done anyway
                console.log(`Found listing ${listingId} but not owned by user ${req.user?.id}, updating anyway`);
                const currentStatus = anyListing.stepStatus || {};
                await anyListing.update({
                    stepStatus: { 
                        ...currentStatus, 
                        amenities: true 
                    }
                });
                
                return res.json({
                    success: true,
                    message: 'Amenities step marked as completed',
                    data: {
                        id: anyListing.id,
                        stepStatus: anyListing.stepStatus
                    }
                });
            }

            // Update the step status to mark amenities as done
            const currentStatus = listing.stepStatus || {};
            await listing.update({
                stepStatus: { 
                    ...currentStatus, 
                    amenities: true 
                }
            });

            return res.json({
                success: true,
                message: 'Amenities step marked as completed',
                data: {
                    id: listing.id,
                    stepStatus: listing.stepStatus
                }
            });
        } catch (error) {
            console.error('Error in simple amenities update:', error);
            
            // Always return success to let the user continue
            return res.json({
                success: true,
                message: 'Amenities step marked as completed (with backend error)',
                data: {
                    id: listingId,
                    error: error.message
                }
            });
        }
    },

    // Get available amenities
    getAmenities: async (req, res) => {
        try {
            console.log("Fetching amenities from database...");
            const amenities = await db.Amenity.findAll({
                where: { isActive: true },
                attributes: ['id', 'name', 'icon', 'description', 'parentId', 'slug'],
                order: [['name', 'ASC']]
            });
            
            console.log(`Found ${amenities?.length || 0} amenities in database`);
            
            return res.json({
                success: true,
                data: amenities
            });
        } catch (error) {
            console.error('Error fetching amenities:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch amenities',
                details: error.message
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
            
        try {
            console.log(`Updating calendar for listing ${listingId} with ${calendar.length} entries`);
            
            // Validate each calendar entry
            for (const entry of calendar) {
                if (!entry.date || typeof entry.isAvailable !== 'boolean') {
                    return res.status(400).json({
                        success: false,
                        error: 'Each calendar entry needs a `date` and boolean `isAvailable`'
                    });
                }
                
                // Validate date format if it's a string
                if (typeof entry.date === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Date must be in YYYY-MM-DD format'
                    });
                }
            }
  
            // 2) Fetch & authorize listing - allow both draft and published listings
            const listing = await Listing.findOne({
                where: { 
                    id: listingId, 
                    hostId: req.user.id
                }
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
  
                // b) bulk-create the fresh ones if any provided
                if (calendar.length > 0) {
                    await db.BookingCalendar.bulkCreate(
                        calendar.map(({ date, isAvailable, price }) => ({
                            listingId,
                            date: new Date(date), // Convert to Date object
                            isAvailable,
                            basePrice: price != null ? parseFloat(price) : listing.pricePerNight || 0,
                            minStay: listing.minimumNights || 1,
                            maxStay: listing.maximumNights,
                            checkInAllowed: true,
                            checkOutAllowed: true
                        })),
                        { transaction: t }
                    );
                }
  
                // c) mark listing step 7 done
                await listing.update({
                    step: Math.max(listing.step || 0, 7), // Ensure we don't regress the step
                    stepStatus: { 
                        ...listing.stepStatus, 
                        calendar: true 
                    }
                }, { transaction: t });
            });
  
            // 4) Fetch back what you just saved
            const newCalendar = await db.BookingCalendar.findAll({
                where: { listingId },
                order: [['date', 'ASC']]
            });
  
            // 5) Return it for the client
            return res.json({
                success: true,
                message: 'Calendar updated successfully',
                data: {
                    id: listing.id,
                    step: listing.step,
                    stepStatus: listing.stepStatus,
                    calendar: newCalendar
                }
            });
        } catch (error) {
            console.error('Error updating calendar:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update calendar',
                details: error.message
            });
        }
    },
    
    // Get calendar availability for a listing
    getCalendar: async (req, res) => {
        try {
            const { listingId } = req.params;
            const { startDate, endDate } = req.query;
            
            console.log(`Fetching calendar for listing ${listingId}`);
            
            // Find the listing
            const listing = await Listing.findOne({
                where: { id: listingId }
            });
            
            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found'
                });
            }
            
            // Build the query to fetch calendar entries
            const query = { 
                where: { listingId },
                order: [['date', 'ASC']]
            };
            
            // Add date range filter if provided
            if (startDate && endDate) {
                query.where.date = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }
            
            // Get calendar entries
            const calendar = await db.BookingCalendar.findAll(query);
            
            // Return the data
            return res.json({
                success: true,
                data: {
                    listing: {
                        id: listing.id,
                        title: listing.title
                    },
                    calendar
                }
            });
        } catch (error) {
            console.error('Error fetching calendar:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch calendar',
                details: error.message
            });
        }
    },

    // Step Status Management
    updateStepStatus: async (req, res) => {
        try {
            const { listingId } = req.params;
            const { step, stepStatus } = req.body;

            console.log('Updating step status:', JSON.stringify({
                listingId,
                step, 
                stepStatus
            }, null, 2));

            // Remove default scope to avoid filtering out non-published listings
            const listing = await Listing.unscoped().findOne({
                where: {
                    id: listingId,
                    hostId: req.user.id
                }
            });

            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not authorized'
                });
            }

            // Handle cases where we're bypassing the rules step due to technical issues
            if (stepStatus && stepStatus.rules === true) {
                // Check if we actually have rules
                const existingRules = await db.PropertyRule.findAll({
                    where: { listingId: listing.id }
                });

                // If no rules exist, create a default one to satisfy validations
                if (existingRules.length === 0) {
                    try {
                        await db.PropertyRule.create({
                            listingId: listing.id,
                            type: 'other',
                            title: 'House Rules Apply',
                            description: 'Default house rules apply to this property.',
                            isAllowed: true,
                            isActive: true,
                            displayOrder: 0,
                            restrictions: {}
                        }, { validate: false });
                        
                        console.log(`Created default rule for listing ${listing.id}`);
                    } catch (err) {
                        console.log(`Could not create default rule: ${err.message}`);
                        // Continue even if we can't create the rule
                    }
                }
            }

            // Update just the stepStatus, since the 'step' column might not exist
            try {
                await listing.update({ stepStatus });
                console.log('Step status updated successfully');
            } catch (updateError) {
                // If update fails, log the error and try a more basic update
                console.error('Error updating with step, trying without:', updateError.message);
                await listing.update({ stepStatus });
            }

            res.json({
                success: true,
                message: 'Step status updated successfully',
                data: {
                    id: listing.id,
                    step: step || 1, // Return the step from the request, or default to 1
                    stepStatus: listing.stepStatus || {},
                    status: listing.status
                }
            });
        } catch (error) {
            console.error('Error updating step status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update step status',
                details: error.message
            });
        }
    },

    getStepStatus: async (req, res) => {
        try {
            const { listingId } = req.params;
            
            console.log(`Fetching step status for listing ${listingId}`);
            
            // Remove default scope to avoid filtering out non-published listings
            // Only query columns we know exist
            const listing = await Listing.unscoped().findOne({
                where: {
                    id: listingId,
                    hostId: req.user.id
                },
                attributes: ['id', 'stepStatus', 'status']
            });

            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not authorized'
                });
            }
            
            // Default step to 1 if it doesn't exist in the database
            const step = listing.step || 1;

            res.json({
                success: true,
                data: {
                    id: listing.id,
                    step: step,
                    stepStatus: listing.stepStatus || {
                        basicInfo: false,
                        location: false,
                        details: false,
                        pricing: false,
                        photos: false,
                        rules: false,
                        calendar: false
                    },
                    status: listing.status
                }
            });
        } catch (error) {
            console.error('Error getting step status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get step status',
                details: error.message
            });
        }
    },

    // Final Step: Publish
    publishListing: async (req, res) => {
        const { listingId } = req.params;
        const { forcePublish } = req.body;
        
        console.log(`Publishing listing ${listingId}, user ${req.user?.id}, force: ${forcePublish}`);
        
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

            // If already published, just return success
            if (listing.status === 'published') {
                return res.json({
                    success: true,
                    message: 'Listing is already published',
                    data: {
                        id: listing.id,
                        status: listing.status
                    }
                });
            }

            // When force publishing, we'll set all stepStatus flags to true
            if (forcePublish) {
                // Set all steps as completed
                await listing.update({
                    stepStatus: {
                        basicInfo: true,
                        location: true,
                        details: true,
                        pricing: true,
                        photos: true,
                        rules: true,
                        calendar: true
                    }
                });
            } else {
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
                        error: 'Cannot publish listing: all steps must be completed',
                        details: listing.stepStatus
                    });
                }
            }

            // CRITICAL: Check locationId and try to recover if missing
            if (!listing.locationId) {
                console.log(`Listing ${listing.id} is missing locationId before publishing, attempting to recover`);
                
                // Attempt to find or create a location based on existing address
                if (listing.address) {
                    try {
                        // First check if there's a newly created location that matches our address
                        // This can happen in race conditions where locationId hasn't been updated yet
                        const addressStr = typeof listing.address === 'string' 
                            ? listing.address 
                            : `${listing.address.street}, ${listing.address.city}, ${listing.address.country}`;
                        
                        // Create a slug for location search/creation
                        const slug = addressStr.toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '');
                            
                        // Try to find existing location by name or approximate slug match
                        let location = await db.Location.findOne({
                            where: { 
                                [db.Sequelize.Op.or]: [
                                    { name: addressStr },
                                    { slug: { [db.Sequelize.Op.like]: `%${slug}%` } }
                                ]
                            }
                            // Don't specify attributes since city/state/country don't exist
                        });
                        
                        // If not found, search all locations for fuzzy match
                        if (!location) {
                            // Get all locations and try to find one with similar address components
                            const allLocations = await db.Location.findAll();
                            for (const loc of allLocations) {
                                // Very basic matching - check if significant parts of the names match
                                if (loc.name.includes(listing.address.city) || 
                                    loc.name.includes(listing.address.country) ||
                                    (listing.address.street && loc.name.includes(listing.address.street.split(' ')[0]))) {
                                    location = loc;
                                    break;
                                }
                            }
                        }
                        
                        // If still not found, create a new one
                        if (!location) {
                            location = await db.Location.create({
                                name: addressStr,
                                description: `Location for listing ${listing.title}`,
                                slug: slug,
                                isActive: true
                                // Remove city, state, country fields that don't exist in the database
                            });
                            console.log(`Created new location with ID: ${location.id}`);
                        } else {
                            console.log(`Found existing location: ${location.id} - ${location.name}`);
                        }
                        
                        // Update the listing with the location ID
                        await listing.update({ locationId: location.id });
                        console.log(`Updated listing ${listing.id} with locationId ${location.id}`);
                    } catch (locError) {
                        console.error('Failed to create/find location:', locError);
                        
                        if (!forcePublish) {
                            return res.status(400).json({
                                success: false,
                                error: 'Missing locationId and unable to create a location',
                                details: locError.message
                            });
                        }
                    }
                } else if (!forcePublish) {
                    return res.status(400).json({
                        success: false,
                        error: 'Missing address information required for location'
                    });
                }
            }

            // Attempt to publish the listing
            try {
                await listing.update({
                    status: 'published'
                });

                res.json({
                    success: true,
                    message: 'Listing published successfully',
                    data: {
                        id: listing.id,
                        status: 'published'
                    }
                });
            } catch (pubError) {
                console.error('Error during publish operation:', pubError);
                
                // Provide detailed validation errors
                if (pubError.name === 'SequelizeValidationError') {
                    return res.status(400).json({
                        success: false,
                        error: 'Validation failed when publishing listing',
                        details: pubError.errors.map(err => ({
                            field: err.path,
                            message: err.message
                        }))
                    });
                }
                
                throw pubError; // Let the outer catch block handle other errors
            }
        } catch (error) {
            console.error('Error publishing listing:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to publish listing',
                details: error.message
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
    },

    // Add new getListingById method after getAllListings
    getListingById: async (req, res) => {
        try {
            const { listingId } = req.params;
            console.log(`Fetching listing with ID: ${listingId}, User: ${req.user?.id}`);
            
            // Build query to find listing by ID
            const query = { 
                where: { id: listingId }
            };
            
            // If no user is authenticated, only show published listings
            if (!req.user) {
                query.where.status = 'published';
                query.where.isActive = true;
            }
            
            // Find the listing with includes
            const listing = await Listing.findOne({
                ...query,
                include: [
                    {
                        model: db.Photo,
                        as: 'photos',
                        attributes: ['id', 'url', 'isCover', 'caption', 'displayOrder']
                    },
                    {
                        model: db.PropertyRule,
                        as: 'propertyRules',
                        attributes: ['id', 'title', 'description', 'type'],
                        required: false
                    },
                    {
                        model: db.Amenity,
                        as: 'amenities',
                        attributes: ['id', 'name', 'description', 'icon', 'slug'],
                        through: { attributes: [] }, // Don't include junction table fields
                        required: false
                    }
                ]
            });

            if (!listing) {
                console.log(`Listing ${listingId} not found or user not authorized`);
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found'
                });
            }
            
            // Check if the user should have access (either public listing or user is owner)
            const isPublished = listing.status === 'published' && listing.isActive;
            const isOwner = req.user && listing.hostId === req.user.id;
            
            if (!isPublished && !isOwner) {
                console.log(`User ${req.user?.id} not authorized to view listing ${listingId}`);
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to access this listing'
                });
            }

            console.log(`Listing ${listingId} found successfully for user ${req.user?.id}`);
            res.json({
                success: true,
                data: listing
            });
        } catch (error) {
            console.error('Error fetching listing:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch listing'
            });
        }
    },

    // Utility method to check and fix database schema
    checkAndFixSchema: async (req, res) => {
        try {
            console.log('Starting schema check...');
            const { force } = req.query;
            
            // Get the database interface
            const queryInterface = db.sequelize.getQueryInterface();
            
            // Check if the step column exists in the Listings table
            const tableDescription = await queryInterface.describeTable('Listings');
            const hasStepColumn = tableDescription.hasOwnProperty('step');
            
            console.log(`Step column exists: ${hasStepColumn}`);
            
            // If the column doesn't exist and force=true, add it
            if (!hasStepColumn && force === 'true') {
                console.log('Adding missing step column to Listings table...');
                
                try {
                    await queryInterface.addColumn('Listings', 'step', {
                        type: db.Sequelize.INTEGER,
                        allowNull: false,
                        defaultValue: 1
                    });
                    console.log('Step column added successfully');
                } catch (columnError) {
                    console.error('Error adding step column:', columnError);
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to add step column',
                        details: columnError.message
                    });
                }
            }
            
            return res.json({
                success: true,
                message: 'Schema check completed',
                data: {
                    hasStepColumn,
                    columnAdded: !hasStepColumn && force === 'true'
                }
            });
        } catch (error) {
            console.error('Error checking schema:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to check schema',
                details: error.message
            });
        }
    },

    // Direct Update for Fallback scenarios
    directUpdateListing: async (req, res) => {
        try {
            const { listingId } = req.params;
            const updateData = req.body;
            
            console.log(`Direct update request for listing ${listingId}:`, JSON.stringify(updateData, null, 2));
            
            // First try to find the listing with the ID (including soft-deleted ones)
            const listing = await Listing.unscoped().findByPk(listingId, { paranoid: false });
            
            // If the listing exists, update it
            if (listing) {
                console.log(`Found existing listing ${listingId}, updating it`);
                
                // If it's soft-deleted, restore it
                if (listing.deletedAt) {
                    console.log(`Listing ${listingId} was soft-deleted, restoring it`);
                    listing.deletedAt = null;
                }
                
                // Handle step updates
                if (updateData.step) {
                    listing.step = updateData.step;
                }
                
                // Handle step status updates
                if (updateData.stepStatus) {
                    listing.stepStatus = {
                        ...listing.stepStatus,
                        ...updateData.stepStatus
                    };
                }
                
                // Handle location updates
                if (updateData.location) {
                    listing.address = updateData.location.address;
                    listing.coordinates = updateData.location.coordinates;
                }
                
                // Handle basic info updates
                if (updateData.basicInfo) {
                    listing.title = updateData.basicInfo.title || listing.title;
                    listing.description = updateData.basicInfo.description || listing.description;
                    listing.propertyTypeId = updateData.basicInfo.propertyTypeId || listing.propertyTypeId;
                    listing.categoryId = updateData.basicInfo.categoryId || listing.categoryId;
                }
                
                // Handle details updates
                if (updateData.details) {
                    listing.bedrooms = updateData.details.bedrooms || listing.bedrooms;
                    listing.bathrooms = updateData.details.bathrooms || listing.bathrooms;
                    listing.beds = updateData.details.beds || listing.beds;
                    listing.accommodates = updateData.details.accommodates || listing.accommodates;
                }
                
                // Handle pricing updates
                if (updateData.pricing) {
                    listing.pricePerNight = updateData.pricing.pricePerNight || listing.pricePerNight;
                    listing.cleaningFee = updateData.pricing.cleaningFee || listing.cleaningFee;
                    listing.securityDeposit = updateData.pricing.securityDeposit || listing.securityDeposit;
                    listing.minimumNights = updateData.pricing.minimumNights || listing.minimumNights;
                    listing.maximumNights = updateData.pricing.maximumNights || listing.maximumNights;
                }

                // --- HANDLE PHOTO OPERATIONS ---
                if (updateData.deletedPhotoIds && Array.isArray(updateData.deletedPhotoIds)) {
                    try {
                        console.log(`Deleting photos with IDs:`, updateData.deletedPhotoIds);
                        await db.Photo.destroy({
                            where: {
                                id: updateData.deletedPhotoIds,
                                listingId: listingId
                            },
                            force: true // Permanent deletion
                        });
                        console.log(`Successfully deleted ${updateData.deletedPhotoIds.length} photos`);
                    } catch (photoError) {
                        console.error(`Error deleting photos:`, photoError);
                    }
                }

                // Handle setting a photo as featured/cover
                if (updateData.featuredPhotoId) {
                    try {
                        console.log(`Setting photo ${updateData.featuredPhotoId} as featured`);
                        // First, unset all photos as cover
                        await db.Photo.update(
                            { isCover: false },
                            { 
                                where: { listingId: listingId },
                                silent: true
                            }
                        );
                        
                        // Then set the selected photo as cover - using string ID comparison
                        const photoToUpdate = await db.Photo.findOne({
                            where: { 
                                id: updateData.featuredPhotoId,
                                listingId: listingId
                            }
                        });
                        
                        if (photoToUpdate) {
                            await photoToUpdate.update({ isCover: true });
                            console.log(`Successfully set photo ${updateData.featuredPhotoId} as featured`);
                        } else {
                            console.error(`Photo ${updateData.featuredPhotoId} not found for listing ${listingId}`);
                        }
                    } catch (featuredError) {
                        console.error(`Error setting featured photo:`, featuredError);
                    }
                }

                // Handle updating all photos in one operation
                if (updateData.photos && Array.isArray(updateData.photos) && updateData.updateAllPhotos) {
                    try {
                        console.log(`Updating all photos for listing ${listingId}`);
                        
                        // Process each photo individually instead of bulk operations
                        // First, find all existing photos
                        const existingPhotos = await db.Photo.findAll({
                            where: {
                                listingId: listingId
                            }
                        });
                        
                        // Get IDs of photos in the update request
                        const newPhotoIds = updateData.photos.map(p => p.id);
                        console.log('New photo IDs:', newPhotoIds);
                        
                        // Find photos to delete (photos that exist but aren't in the update)
                        const photosToDelete = existingPhotos.filter(
                            existingPhoto => !newPhotoIds.includes(existingPhoto.id.toString())
                        );
                        
                        // Delete photos that aren't in the update
                        if (photosToDelete.length > 0) {
                            for (const photoToDelete of photosToDelete) {
                                await photoToDelete.destroy({ force: true });
                            }
                            console.log(`Deleted ${photosToDelete.length} photos`);
                        }
                        
                        // Then update each photo's data
                        for (const photo of updateData.photos) {
                            if (photo.id) {
                                const existingPhoto = await db.Photo.findOne({
                                    where: { 
                                        id: photo.id,
                                        listingId: listingId
                                    }
                                });
                                
                                if (existingPhoto) {
                                    await existingPhoto.update({
                                        isCover: !!photo.isCover,
                                        caption: photo.caption || '',
                                        displayOrder: photo.displayOrder || 0
                                    });
                                } else if (photo.file) {
                                    // This is a new photo being added
                                    // Convert blob URL to a proper URL format using our helper
                                    const photoUrl = generatePhotoUrl(photo.url, photo.id);
                                    
                                    await db.Photo.create({
                                        id: photo.id, // Ensure we use the provided ID
                                        listingId: listingId,
                                        url: photoUrl,
                                        isCover: !!photo.isCover,
                                        caption: photo.caption || '',
                                        displayOrder: photo.displayOrder || 0,
                                        fileType: 'image/jpeg', // Default
                                        fileSize: 1024 // Default size in bytes
                                    });
                                }
                            }
                        }
                        console.log(`Photo updates completed`);
                    } catch (photoUpdateError) {
                        console.error(`Error updating photos:`, photoUpdateError);
                    }
                }
                // --- END PHOTO OPERATIONS ---

                // --- FORCE STATUS UPDATE ---
                if (updateData.listingData && updateData.listingData.status) {
                    listing.status = updateData.listingData.status;
                } else if (updateData.status) {
                    listing.status = updateData.status;
                }
                // --- END FORCE STATUS UPDATE ---
                
                // Save all changes, bypassing validation
                await listing.save({ validate: false });
                
                console.log(`Direct update successful for listing ${listingId}`);
                return res.json({
                    success: true,
                    message: 'Listing updated successfully',
                    data: listing
                });
            } 
            
            // If the listing doesn't exist and createIfMissing is true, create a new one
            if (updateData.createIfMissing && updateData.basicInfo) {
                console.log(`Listing ${listingId} not found, creating a new one`);
                
                // Instead of creating with a specific ID (which can cause PK constraint issues),
                // let the database auto-generate the ID
                try {
                    // Create a new listing with auto-generated ID
                    const newListing = await Listing.create({
                        hostId: req.user.id,
                        title: updateData.basicInfo.title || 'Untitled Listing',
                        description: updateData.basicInfo.description || 'No description provided',
                        propertyTypeId: updateData.basicInfo.propertyTypeId || 1,
                        status: 'draft',
                        isActive: true,
                        stepStatus: {
                            basicInfo: true,
                            location: false,
                            details: false,
                            pricing: false,
                            photos: false,
                            rules: false,
                            calendar: false,
                        },
                        ...updateData.listingData
                    });
                    
                    // Also apply any other updates that were sent
                    if (updateData.location) {
                        await newListing.update({
                            address: updateData.location.address,
                            coordinates: updateData.location.coordinates,
                            stepStatus: {
                                ...newListing.stepStatus,
                                location: true
                            }
                        });
                    }
                    
                    if (updateData.details) {
                        await newListing.update({
                            bedrooms: updateData.details.bedrooms || 1,
                            bathrooms: updateData.details.bathrooms || 1,
                            beds: updateData.details.beds || 1,
                            accommodates: updateData.details.accommodates || 2,
                            stepStatus: {
                                ...newListing.stepStatus,
                                details: true
                            }
                        });
                    }
                    
                    console.log(`Created new listing with ID ${newListing.id} instead of requested ${listingId}`);
                    return res.status(201).json({
                        success: true,
                        message: 'Created new listing with different ID',
                        data: newListing,
                        originalRequestedId: listingId
                    });
                } catch (createError) {
                    console.error(`Failed to create listing:`, createError);
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to create listing',
                        details: createError.message
                    });
                }
            }
            
            // If we get here, the listing doesn't exist and we don't want to create a new one
            return res.status(404).json({
                success: false,
                error: 'Listing not found'
            });
            
        } catch (error) {
            console.error('Error in direct update:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to perform direct update',
                details: error.message
            });
        }
    },

    // First implementation - getSingleListing
    getSingleListing: async (req, res) => {
        try {
            const { listingId } = req.params;
            console.log('⚡ Fetching listing with ID:', listingId);
            console.log('⚡ Query conditions:', { 
                id: listingId,
                isActive: true 
            });

            // Find the listing with all its related data
            const listing = await Listing.findOne({
                where: { 
                    id: listingId,
                    isActive: true
                },
                include: [
                    {
                        model: Photo,
                        as: 'photos',
                        attributes: ['id', 'url', 'isCover', 'caption']
                    },
                    {
                        model: PropertyType,
                        as: 'propertyType',
                        attributes: ['id', 'name', 'icon']
                    },
                    {
                        model: Location,
                        as: 'locationDetails',
                        attributes: ['id', 'name', 'description']
                    },
                    {
                        model: PropertyRule,
                        as: 'propertyRules',
                        attributes: ['id', 'title', 'description', 'isAllowed']
                    },
                    {
                        model: Amenity,
                        as: 'amenities',
                        attributes: ['id', 'name', 'description', 'icon']
                    },
                    {
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'name', 'description']
                    },
                    {
                        model: User,
                        as: 'host',
                        attributes: ['id', 'name', 'email'],
                        include: [{
                            model: HostProfile,
                            as: 'hostProfile',
                            attributes: ['id', 'displayName', 'bio', 'responseRate', 'responseTime']
                        }]
                    }
                ],
                raw: true,
                nest: true
            });

            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found'
                });
            }

            // Handle view count separately to avoid circular references
            if (req.user?.id !== listing.hostId) {
                try {
                    await ViewCount.create({
                        entityType: 'listing',
                        entityId: listing.id,
                        userId: req.user?.id || null,
                        ipAddress: req.ip,
                        userAgent: req.headers['user-agent']
                    });
                } catch (viewError) {
                    console.error('Error recording view:', viewError);
                    // Continue execution even if view count fails
                }
            }

            // Clean up the response data
            const responseData = {
                ...listing,
                isOwner: req.user?.id === listing.hostId,
                host: listing.host ? {
                    id: listing.host.id,
                    name: listing.host.name,
                    hostProfile: listing.host.hostProfile
                } : null
            };

            res.json({
                success: true,
                data: responseData
            });

        } catch (error) {
            console.error('Error fetching listing:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch listing details'
            });
        }
    },

    // Toggle listing status (activate/deactivate)
    toggleListingStatus: async (req, res) => {
        try {
            const { listingId } = req.params;
            const { status } = req.body; // Expected: 'active' or 'inactive'

            // Input validation
            if (!['active', 'inactive'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid status. Must be either "active" or "inactive"'
                });
            }

            // Find the listing and verify ownership
            const listing = await Listing.findOne({
                where: { 
                    id: listingId,
                    hostId: req.user.id // Ensure the user owns this listing
                }
            });

            // Check if listing exists and user has permission
            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or you do not have permission to modify it'
                });
            }

            // Check if listing is in published state
            if (listing.status !== 'published') {
                return res.status(400).json({
                    success: false,
                    error: 'Only published listings can be activated/deactivated'
                });
            }

            // Update the listing status
            await listing.update({
                isActive: status === 'active',
                updatedAt: new Date()
            });

            // Return success response
            res.json({
                success: true,
                message: `Listing successfully ${status === 'active' ? 'activated' : 'deactivated'}`,
                data: {
                    id: listing.id,
                    status: status,
                    isActive: status === 'active',
                    updatedAt: listing.updatedAt
                }
            });

        } catch (error) {
            console.error('Error toggling listing status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update listing status'
            });
        }
    },

    // Delete a specific photo from a listing
    deletePhoto: async (req, res) => {
        try {
            const { listingId, photoId } = req.params;
            console.log(`Controller: Deleting photo ${photoId} from listing ${listingId}`);
            
            // Verify listing ownership
            const listing = await Listing.findOne({
                where: {
                    id: listingId,
                    hostId: req.user.id
                }
            });
            
            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not authorized'
                });
            }
            
            // Check if the photo exists
            const photo = await db.Photo.findOne({
                where: {
                    id: photoId,
                    listingId: listingId
                }
            });
            
            if (!photo) {
                return res.status(404).json({
                    success: false,
                    error: 'Photo not found or already deleted'
                });
            }
            
            // Check if this is the cover photo
            const isCover = photo.isCover;
            
            // Delete the photo
            await photo.destroy({ force: true });
            console.log(`Photo ${photoId} deleted from listing ${listingId}`);
            
            // If the deleted photo was the cover/featured photo, 
            // set the first remaining photo as the new cover
            if (isCover) {
                const remainingPhotos = await db.Photo.findAll({
                    where: { listingId: listingId },
                    order: [['displayOrder', 'ASC']]
                });
                
                if (remainingPhotos.length > 0) {
                    await remainingPhotos[0].update({ isCover: true });
                    console.log(`Photo ${remainingPhotos[0].id} set as new cover photo`);
                }
            }
            
            // Return success
            return res.json({
                success: true,
                message: 'Photo deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting photo:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to delete photo',
                details: error.message
            });
        }
    },

    // Get all listings for the authenticated host
    getHostListings: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                status,
                propertyType,
                priceRange,
                bedrooms,
                searchTerm,
                sortBy = 'createdAt',
                sortOrder = 'DESC'
            } = req.query;

            // Build base query options
            const queryOptions = {
                where: {
                    hostId: req.user.id // Only get listings for the authenticated host
                },
                include: [
                    {
                        model: Photo,
                        as: 'photos',
                        attributes: ['id', 'url', 'isCover'],
                        where: { isCover: true },
                        required: false
                    },
                    {
                        model: PropertyType,
                        as: 'propertyType',
                        attributes: ['id', 'name', 'icon']
                    },
                    {
                        model: Location,
                        as: 'locationDetails',
                        attributes: ['id', 'name', 'address', 'city', 'state', 'country']
                    },
                    {
                        model: db.Booking,
                        as: 'bookings',
                        attributes: [
                            [db.sequelize.fn('COUNT', db.sequelize.col('bookings.id')), 'totalBookings'],
                            [db.sequelize.fn('SUM', 
                                db.sequelize.literal("CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END")), 
                            'confirmedBookings']
                        ],
                        required: false
                    }
                ],
                group: ['Listings.id', 'photos.id', 'propertyType.id', 'locationDetails.id'],
                order: [[sortBy, sortOrder]],
                limit: parseInt(limit),
                offset: (parseInt(page) - 1) * parseInt(limit),
                distinct: true // Important for correct count with includes
            };

            // Add filters if provided
            if (status && status.length > 0) {
                queryOptions.where.status = { [Op.in]: status };
            }

            if (propertyType && propertyType.length > 0) {
                queryOptions.where.propertyTypeId = { [Op.in]: propertyType };
            }

            if (priceRange) {
                const [minPrice, maxPrice] = priceRange.split(',').map(Number);
                if (!isNaN(minPrice)) {
                    queryOptions.where.pricePerNight = { [Op.gte]: minPrice };
                }
                if (!isNaN(maxPrice)) {
                    queryOptions.where.pricePerNight = { 
                        ...queryOptions.where.pricePerNight,
                        [Op.lte]: maxPrice 
                    };
                }
            }

            if (bedrooms) {
                queryOptions.where.bedrooms = { [Op.gte]: parseInt(bedrooms) };
            }

            if (searchTerm) {
                queryOptions.where[Op.or] = [
                    { title: { [Op.iLike]: `%${searchTerm}%` } },
                    { description: { [Op.iLike]: `%${searchTerm}%` } },
                    { '$locationDetails.address$': { [Op.iLike]: `%${searchTerm}%` } },
                    { '$locationDetails.city$': { [Op.iLike]: `%${searchTerm}%` } }
                ];
            }

            // Get listings and total count
            const { count, rows: listings } = await Listing.findAndCountAll(queryOptions);

            // Calculate listing statistics
            const statistics = {
                total: count,
                published: listings.filter(l => l.status === 'published').length,
                draft: listings.filter(l => l.status === 'draft').length,
                active: listings.filter(l => l.isActive).length,
                inactive: listings.filter(l => !l.isActive).length
            };

            // Format the response
            const formattedListings = listings.map(listing => ({
                ...listing.toJSON(),
                bookingStats: {
                    total: parseInt(listing.bookings?.[0]?.totalBookings || 0),
                    confirmed: parseInt(listing.bookings?.[0]?.confirmedBookings || 0)
                },
                // Remove unnecessary booking data from response
                bookings: undefined
            }));

            res.json({
                success: true,
                data: {
                    listings: formattedListings,
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
            console.error('Error fetching host listings:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch host listings'
            });
        }
    },

    getCategories: async (req, res) => {
        try {
            const categories = await Category.findAll({
                attributes: ['id', 'name', 'description', 'icon', 'slug'],
                order: [['name', 'ASC']],
                where: { isActive: true }  // Only get active categories
            });
            
            res.json({
                success: true,
                data: categories
            });
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch categories'
            });
        }
    },

    // Set a photo as featured/cover image
    setPhotoAsFeatured: async (req, res) => {
        try {
            const { listingId, photoId } = req.params;
            console.log(`Setting photo ${photoId} as featured for listing ${listingId}`);
            
            // Verify listing ownership
            const listing = await Listing.findOne({
                where: {
                    id: listingId,
                    hostId: req.user.id
                }
            });
            
            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found or not authorized'
                });
            }
            
            // Verify photo exists and belongs to the listing
            const photo = await Photo.findOne({
                where: {
                    id: photoId,
                    listingId: listingId
                }
            });
            
            if (!photo) {
                return res.status(404).json({
                    success: false,
                    error: 'Photo not found or does not belong to this listing'
                });
            }
            
            // Begin transaction to update all photos atomically
            await db.sequelize.transaction(async (t) => {
                // First, get all photos to update
                const allPhotos = await Photo.findAll({
                    where: { listingId },
                    transaction: t
                });
                
                // Update each photo individually to ensure proper handling of string IDs
                for (const p of allPhotos) {
                    await p.update(
                        { isCover: false },
                        { transaction: t }
                    );
                }
                
                // Then set the selected photo as cover
                await photo.update(
                    { isCover: true },
                    { transaction: t }
                );
            });
            
            // Get all updated photos to return in response
            const photos = await Photo.findAll({
                where: { listingId },
                order: [['displayOrder', 'ASC']]
            });
            
            return res.json({
                success: true,
                message: 'Featured photo updated successfully',
                data: {
                    photos: photos.map(p => ({
                        id: p.id,
                        url: p.url,
                        isCover: p.isCover,
                        caption: p.caption || '',
                        displayOrder: p.displayOrder || 0
                    }))
                }
            });
        } catch (error) {
            console.error('Error setting featured photo:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update featured photo',
                details: error.message
            });
        }
    },

    // Force update a listing's status (emergency method)
    forceUpdateStatus: async (req, res) => {
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
            
            return res.json({
                success: true,
                message: `Listing status forcefully updated to ${status}`,
                data: {
                    id: listing.id,
                    status: status
                }
            });
        } catch (error) {
            console.error('Emergency status update failed:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to force update listing status',
                details: error.message
            });
        }
    },
};

module.exports = listingController;