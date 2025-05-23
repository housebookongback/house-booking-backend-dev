const { Op, literal } = require('sequelize');
const { Listing, Location, PropertyType, RoomType, Amenity, Photo, Review, User, BookingCalendar, Category } = require('../models');
const { sequelize } = require('../models');
const NodeCache = require('node-cache');

// Cache for popular searches with 1 hour TTL
const popularSearchesCache = new NodeCache({ stdTTL: 3600 });

const searchService = {
    // Build search query with filters
    buildSearchQuery: async (params) => {
        const {
            query,
            location,
            checkIn,
            checkOut,
            guests,
            priceRange,
            propertyTypes,
            roomTypes,
            amenities,
            instantBook,
            superhostOnly,
            categories,
            page = 1,
            limit = 20,
            sort = 'relevance',
            fallbackSearch = false
        } = params;

        console.log('Search service received params:', { checkIn, checkOut });

        // Validate dates if provided
        if (checkIn || checkOut) {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to start of day
            console.log('Today:', today.toISOString());

            if (checkIn) {
                // Ensure checkIn is a valid date string
                if (!Date.parse(checkIn)) {
                    throw new Error('Invalid check-in date format');
                }
                
                const checkInDate = new Date(checkIn);
                checkInDate.setHours(0, 0, 0, 0);
                console.log('Check-in date:', checkInDate.toISOString());
                console.log('Is check-in in past?', checkInDate < today);
                
                if (checkInDate < today) {
                    throw new Error('Check-in date cannot be in the past');
                }
            }

            if (checkOut) {
                // Ensure checkOut is a valid date string
                if (!Date.parse(checkOut)) {
                    throw new Error('Invalid check-out date format');
                }

                const checkOutDate = new Date(checkOut);
                checkOutDate.setHours(0, 0, 0, 0);
                console.log('Check-out date:', checkOutDate.toISOString());

                if (checkIn && checkOutDate <= new Date(checkIn)) {
                    throw new Error('Check-out date must be after check-in date');
                }
            }
        }

        const offset = (page - 1) * limit;
        const where = { status: 'published' };

        // Add category filtering
        if (categories && categories.length > 0) {
            where.categoryId = { [Op.in]: categories };
        }

        // Text search with safe parameter binding
        if (query) {
            if (fallbackSearch) {
                // Looser text search for fallback
                where[Op.or] = [
                    { title: { [Op.iLike]: `%${query}%` } },
                    { description: { [Op.iLike]: `%${query}%` } },
                    { '$Location.city$': { [Op.iLike]: `%${query}%` } },
                    { '$Location.state$': { [Op.iLike]: `%${query}%` } }
                ];
            } else {
                // Strict full-text search
                where[Op.or] = [
                    literal(`to_tsvector('english', "Listings"."title" || ' ' || "Listings"."description") @@ plainto_tsquery('english', ?)`, {
                        replacements: [query]
                    }),
                    { '$Location.city$': { [Op.iLike]: `%${query}%` } },
                    { '$Location.state$': { [Op.iLike]: `%${query}%` } }
                ];
            }
        }

        // Location search with safe parameter binding
        if (location) {
            where['$Location.city$'] = { [Op.iLike]: `%${location}%` };
        }

        // Guest capacity
        if (guests) {
            where.accommodates = { [Op.gte]: guests };
        }

        // Price range
        if (priceRange) {
            const [minPrice, maxPrice] = priceRange.split('-').map(Number);
            where.pricePerNight = {
                [Op.between]: [minPrice || 0, maxPrice || 999999]
            };
        }

        // Property types
        if (propertyTypes && propertyTypes.length > 0) {
            where.propertyTypeId = { [Op.in]: propertyTypes };
        }

        // Room types
        if (roomTypes && roomTypes.length > 0) {
            where.roomTypeId = { [Op.in]: roomTypes };
        }

        // Amenities
        if (amenities && amenities.length > 0) {
            // First, get all parent amenities
            const parentAmenities = await Amenity.findAll({
                where: {
                    id: { [Op.in]: amenities },
                    parentId: null, // Only get parent amenities
                    deletedAt: null,
                    isActive: true
                },
                include: [{
                    model: Amenity,
                    as: 'children',
                    required: false,
                    where: {
                        deletedAt: null,
                        isActive: true
                    },
                    attributes: ['id']
                }]
            });

            // Then, get any child amenities that were directly requested
            const childAmenities = await Amenity.findAll({
                where: {
                    id: { [Op.in]: amenities },
                    parentId: { [Op.ne]: null }, // Only get child amenities
                    deletedAt: null,
                    isActive: true
                }
            });

            // Collect all amenity IDs
            const allAmenityIds = [
                ...parentAmenities.map(parent => parent.id), // Parent IDs
                ...parentAmenities.flatMap(parent => parent.children.map(child => child.id)), // Child IDs from parents
                ...childAmenities.map(child => child.id) // Directly requested child IDs
            ];

            // Use the combined IDs in the where clause
            where['$Amenities.id$'] = { [Op.in]: allAmenityIds };
        }

        // Instant book
        if (instantBook) {
            where.instantBook = true;
        }

        // Superhost only
        if (superhostOnly) {
            where['$Host.isSuperhost$'] = true;
        }

        // Availability check using Sequelize operators
        if (checkIn && checkOut) {
            where.id = {
                [Op.notIn]: sequelize.literal(`(
                    SELECT DISTINCT "listingId"
                    FROM "BookingCalendars"
                    WHERE "date" >= '${checkIn}' AND "date" <= '${checkOut}'
                    AND "isAvailable" = false
                )`)
            };
        }

        // Build Photo-specific filters
        const photoIncludeWhere = {
            isCover: true,
            isActive: true,
            status: 'approved'
        };

        if (photoCategories && photoCategories.length > 0) {
            photoIncludeWhere.category = { [Op.in]: photoCategories };
        }

        if (photoTags && photoTags.length > 0) {
            photoIncludeWhere.tags = { [Op.overlap]: photoTags };
        }

        return {
            where,
            include: [
                {
                    model: Location,
                    as: 'locationDetails',
                    required: true,
                    where: {
                        deletedAt: null,
                        isActive: true
                    }
                },
                {
                    model: PropertyType,
                    as: 'propertyType',
                    required: false,
                    where: {
                        deletedAt: null,
                        isActive: true
                    }
                },
                {
                    model: RoomType,
                    as: 'roomType',
                    required: false,
                    where: {
                        deletedAt: null,
                        isActive: true
                    }
                },
                {
                    model: Amenity,
                    as: 'amenities',
                    required: false,
                    through: { attributes: [] },
                    where: {
                        deletedAt: null,
                        isActive: true
                    },
                    include: [{
                        model: Amenity,
                        as: 'children',
                        required: false,
                        where: {
                            deletedAt: null,
                            isActive: true
                        }
                    }]
                },
                {
                    model: Photo,
                    as: 'photos',
                    required: false,
                    where: { isCover: true },
                    limit: 1
                },
                {
                    model: Review,
                    as: 'reviews',
                    required: false,
                    attributes: ['rating'],
                    where: {
                        deletedAt: null
                    }
                },
                {
                    model: User,
                    as: 'host',
                    required: false,
                    attributes: ['id']
                },
                {
                    model: Category,
                    as: 'category',
                    required: false,
                    where: {
                        isActive: true
                    }
                }
            ],
            offset,
            limit,
            distinct: true
        };
    },

    // Apply sorting to results with safe parameter binding
    sortResults: (query, sortBy) => {
        switch (sortBy) {
            case 'price_asc':
                query.order = [['pricePerNight', 'ASC']];
                break;
            case 'price_desc':
                query.order = [['pricePerNight', 'DESC']];
                break;
            case 'rating':
                query.order = [['averageRating', 'DESC']];
                break;
            case 'reviews':
                query.order = [[literal('COUNT(DISTINCT "Reviews"."id")'), 'DESC']];
                break;
            default: // 'relevance'
                if (query.where && query.where[Op.or] && query.where[Op.or][0].replacements) {
                    const searchQuery = query.where[Op.or][0].replacements[0];
                    query.order = [[literal(`ts_rank(to_tsvector('english', "Listings"."title" || ' ' || "Listings"."description"), plainto_tsquery('english', ?))`, {
                        replacements: [searchQuery]
                    }), 'DESC']];
                }
        }
        return query;
    },

    // Record search history
    recordSearch: async (userId, searchData) => {
        if (!userId) return;

        try {
            await sequelize.models.SearchHistory.create({
                userId,
                query: searchData.query || '',
                filters: searchData,
                resultCount: searchData.resultCount || 0,
                location: searchData.location ? {
                    type: 'Point',
                    coordinates: [searchData.location.longitude, searchData.location.latitude]
                } : null
            });
        } catch (error) {
            console.error('Error recording search history:', error);
        }
    },

    // Get popular searches with caching
    getPopularSearches: async (limit = 10) => {
        const cacheKey = `popular_searches_${limit}`;
        const cachedResults = popularSearchesCache.get(cacheKey);
        
        if (cachedResults) {
            return cachedResults;
        }

        const results = await sequelize.models.SearchHistory.findAll({
            attributes: [
                'query',
                [sequelize.fn('COUNT', sequelize.col('id')), 'searchCount']
            ],
            group: ['query'],
            order: [[sequelize.literal('searchCount'), 'DESC']],
            limit
        });

        popularSearchesCache.set(cacheKey, results);
        return results;
    },

    // Save search filter
    saveFilter: async (userId, { name, filters }) => {
        return await sequelize.models.SearchFilter.create({
            userId,
            name,
            filters
        });
    },

    // Get user's saved filters with pagination
    getSavedFilters: async (userId, { page = 1, limit = 10 } = {}) => {
        const offset = (page - 1) * limit;
        
        const { count, rows } = await sequelize.models.SearchFilter.findAndCountAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            offset,
            limit
        });

        return {
            filters: rows,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            }
        };
    },

    // Add this function to searchService
    groupAmenitiesByCategory: (listings) => {
        return listings.map(listing => {
            const amenitiesByCategory = {};
            
            // Group amenities by their parent
            listing.amenities.forEach(amenity => {
                if (amenity.parentId) {
                    // This is a child amenity
                    const parentAmenity = listing.amenities.find(a => a.id === amenity.parentId);
                    if (parentAmenity) {
                        if (!amenitiesByCategory[parentAmenity.name]) {
                            amenitiesByCategory[parentAmenity.name] = [];
                        }
                        amenitiesByCategory[parentAmenity.name].push(amenity);
                    }
                } else {
                    // This is a parent amenity
                    if (!amenitiesByCategory[amenity.name]) {
                        amenitiesByCategory[amenity.name] = [];
                    }
                    // Add child amenities if they exist
                    const childAmenities = listing.amenities.filter(a => a.parentId === amenity.id);
                    amenitiesByCategory[amenity.name].push(...childAmenities);
                }
            });

            // Add the grouped amenities to the listing
            return {
                ...listing.toJSON(),
                amenitiesByCategory
            };
        });
    },

    // Add this function to searchService
    groupPhotosByCategory: (listings) => {
        return listings.map(listing => {
            const photosByCategory = {};
            
            // Group photos by category
            listing.photos.forEach(photo => {
                if (!photosByCategory[photo.category]) {
                    photosByCategory[photo.category] = [];
                }
                photosByCategory[photo.category].push({
                    id: photo.id,
                    url: photo.url,
                    thumbnailUrl: photo.thumbnailUrl,
                    tags: photo.tags
                });
            });

            return {
                ...listing.toJSON(),
                photosByCategory
            };
        });
    },

    // Modify the search method to include grouped amenities
    search: async (params) => {
        const query = await searchService.buildSearchQuery(params);
        const sortedQuery = searchService.sortResults(query, params.sort);
        const { count, rows } = await sequelize.models.Listing.findAndCountAll(sortedQuery);
        const listingsWithGroupedAmenities = searchService.groupAmenitiesByCategory(rows);
        const listingsWithGroupedPhotos = searchService.groupPhotosByCategory(rows);

        return {
            count,
            listings: listingsWithGroupedPhotos,
            // ... other response data
        };
    },

    // Add these methods to searchService
    getPhotoCategories: async () => {
        const categories = await Photo.findAll({
            attributes: ['category'],
            group: ['category'],
            where: {
                isActive: true,
                status: 'approved'
            }
        });
        return categories.map(c => c.category);
    },

    getPopularPhotoTags: async (limit = 20) => {
        const tags = await Photo.findAll({
            attributes: [
                [sequelize.fn('unnest', sequelize.col('tags')), 'tag'],
                [sequelize.fn('COUNT', sequelize.col('*')), 'count']
            ],
            group: [sequelize.fn('unnest', sequelize.col('tags'))],
            order: [[sequelize.literal('count'), 'DESC']],
            limit
        });
        return tags.map(t => t.tag);
    }
};

module.exports = searchService;
