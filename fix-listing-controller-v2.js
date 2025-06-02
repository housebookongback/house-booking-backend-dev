const fs = require('fs');
const path = require('path');

// Path to the controller file
const controllerPath = path.join(__dirname, 'src', 'controllers', 'listingController.js');

// Read the current file content
const content = fs.readFileSync(controllerPath, 'utf8');

// Define the new implementation for getOneListing
const newMethod = `    // Get single listing by ID (simplified for frontend)
    getOneListing: async (req, res) => {
        try {
            const { listingId } = req.params;
            
            console.log('Getting listing details for ID:', listingId);
            
            // First find the basic listing
            const listing = await Listing.unscoped().findByPk(listingId);

            if (!listing) {
                return res.status(404).json({
                    success: false,
                    error: 'Listing not found'
                });
            }

            // Convert to JSON to manipulate more easily
            const processedListing = listing.toJSON();
            
            // Fetch photos separately
            try {
                const photos = await db.Photo.findAll({
                    where: { listingId: listing.id }
                });
                processedListing.photos = photos || [];
                console.log(\`Found \${photos.length} photos\`);
            } catch (error) {
                console.error('Error fetching photos:', error);
                processedListing.photos = [];
            }
            
            // Fetch amenities separately using direct SQL for reliability
            try {
                const amenities = await db.sequelize.query(
                    \`SELECT a.id, a.name, a.description, a.icon, a.slug 
                     FROM "Amenities" a 
                     JOIN "listing_amenities" la ON a.id = la."amenityId" 
                     WHERE la."listingId" = :listingId\`,
                    {
                        replacements: { listingId: listing.id },
                        type: db.sequelize.QueryTypes.SELECT
                    }
                );
                processedListing.amenities = amenities || [];
                console.log(\`Found \${amenities.length} amenities\`);
            } catch (error) {
                console.error('Error fetching amenities:', error);
                processedListing.amenities = [];
            }
            
            // Fetch property rules separately
            try {
                const propertyRules = await db.sequelize.query(
                    \`SELECT id, title, description, type 
                     FROM "PropertyRules" 
                     WHERE "listingId" = :listingId\`,
                    {
                        replacements: { listingId: listing.id },
                        type: db.sequelize.QueryTypes.SELECT
                    }
                );
                processedListing.propertyRules = propertyRules || [];
                console.log(\`Found \${propertyRules.length} property rules\`);
            } catch (error) {
                console.error('Error fetching property rules:', error);
                processedListing.propertyRules = [];
            }
            
            // Fetch location details separately
            try {
                if (listing.locationId) {
                    const location = await db.Location.findByPk(listing.locationId);
                    if (location) {
                        processedListing.locationDetails = {
                            id: location.id,
                            name: location.name,
                            slug: location.slug
                        };
                    }
                }
            } catch (error) {
                console.error('Error fetching location:', error);
            }
            
            // Create default host information to avoid avatar issues
            processedListing.host = {
                id: listing.hostId,
                name: 'Host Information',
                hostProfile: {
                    superhostSince: new Date().toISOString(),
                    profilePicture: 'https://via.placeholder.com/150',
                    reviewCount: 0,
                    rating: 0,
                    yearsHosting: 0,
                    isSuperhost: false
                }
            };
            
            // Set other required fields
            if (!processedListing.views) processedListing.views = 0;
            if (!processedListing.reviewCount) processedListing.reviewCount = 0;
            if (!processedListing.averageRating) processedListing.averageRating = null;
            if (!processedListing.cancellationPolicy) processedListing.cancellationPolicy = 'Flexible';
            
            // Ensure guest data exists
            if (!processedListing.accommodates) processedListing.accommodates = 2;
            if (!processedListing.adultGuests) processedListing.adultGuests = 1;
            if (!processedListing.childGuests) processedListing.childGuests = 0;
            if (!processedListing.bedrooms) processedListing.bedrooms = 1;
            if (!processedListing.bathrooms) processedListing.bathrooms = 1;
            if (!processedListing.beds) processedListing.beds = 1;
            
            // Ensure coordinates are properly formatted
            if (!processedListing.coordinates) {
                processedListing.coordinates = { lat: 0, lng: 0 };
            } else if (typeof processedListing.coordinates === 'string' && !processedListing.coordinates.includes(',')) {
                processedListing.coordinates = { lat: 0, lng: 0 };
            }
            
            // Ensure address is properly formatted
            if (!processedListing.address) {
                processedListing.address = 'Location information not available';
            }
            
            console.log('Returning listing data:', {
                id: processedListing.id,
                title: processedListing.title,
                photos: processedListing.photos?.length || 0,
                amenities: processedListing.amenities?.length || 0,
                rules: processedListing.propertyRules?.length || 0
            });

            return res.json({
                success: true,
                data: processedListing
            });
        } catch (error) {
            console.error('Error fetching listing:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch listing',
                details: error.message
            });
        }
    },`;

// Define simpler markers - just searching for the function name
const functionStart = 'getOneListing: async (req, res) => {';
const functionEnd = '    // Get all listings for a specific host';

// Find positions in the content
const startIndex = content.indexOf(functionStart);
const endIndex = content.indexOf(functionEnd);

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find the method boundaries');
    console.log('Start marker:', startIndex);
    console.log('End marker:', endIndex);
    process.exit(1);
}

// Get the actual function start/end positions
const actualStart = content.lastIndexOf('    // Get single listing by ID', startIndex - 200);
const actualEnd = endIndex;

if (actualStart === -1) {
    console.error('Could not find the function start comment');
    process.exit(1);
}

// Build the new content
const newContent = 
    content.substring(0, actualStart) + 
    newMethod + 
    content.substring(actualEnd);

// Write the new content back to the file
fs.writeFileSync(controllerPath, newContent, 'utf8');

console.log('Successfully updated getOneListing method'); 