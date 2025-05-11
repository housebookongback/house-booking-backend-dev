const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config');

/* ---------- Sequelize instance ---------- */
const sequelize = new Sequelize(
    process.env.DATABASE_NAME,      // Database name from .env
    process.env.DATABASE_USERNAME,  // Username from .env
    process.env.DATABASE_PASSWORD,  // Password from .env
    {
        host: process.env.DATABASE_HOST, // Host from .env
        port: process.env.DATABASE_PORT, // Port from .env
        dialect: 'postgres',
        logging: false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    }
);

/* ---------- Model definitions ---------- */
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Core models
db.User = require('./user')(sequelize, DataTypes);
db.Role = require('./role')(sequelize, DataTypes);
db.UserRoles = require('./user-roles')(sequelize, DataTypes);

// Verification models
db.Verification = require('./verification')(sequelize, DataTypes);
db.Document = require('./document')(sequelize, DataTypes);

// Property related models
db.PropertyType = require('./propertyType')(sequelize, DataTypes);
db.RoomType = require('./roomType')(sequelize, DataTypes);
db.Listing = require('./listing')(sequelize, DataTypes);
db.Amenity = require('./amenity')(sequelize, DataTypes);
db.ListingAmenities = require('./listing-amenities')(sequelize, DataTypes);
db.Photo = require('./photo')(sequelize, DataTypes);
db.Location = require('./location')(sequelize, DataTypes);
db.Category = require('./category')(sequelize, DataTypes);
db.PropertyRule = require('./propertyRule')(sequelize, DataTypes);
db.PropertyPolicy = require('./propertyPolicy')(sequelize, DataTypes);
db.PropertyAvailability = require('./propertyAvailability')(sequelize, DataTypes);

// Host management models
db.HostProfile = require('./hostProfile')(sequelize, DataTypes);
db.HostVerification = require('./hostVerification')(sequelize, DataTypes);
db.HostEarnings = require('./hostEarnings')(sequelize, DataTypes);

// Guest management models
db.GuestProfile = require('./guestProfile')(sequelize, DataTypes);
db.GuestPreferences = require('./guestPreferences')(sequelize, DataTypes);
db.GuestVerification = require('./guestVerification')(sequelize, DataTypes);

// Booking and pricing models
db.Booking = require('./booking')(sequelize, DataTypes);
db.BookingRequest = require('./bookingRequest')(sequelize, DataTypes);
db.BookingChange = require('./bookingChange')(sequelize, DataTypes);
db.BookingCancellation = require('./bookingCancellation')(sequelize, DataTypes);
db.BookingCalendar = require('./bookingCalendar')(sequelize, DataTypes);
db.SeasonalPricing = require('./seasonalPricing')(sequelize, DataTypes);
db.PriceRule = require('./priceRule')(sequelize, DataTypes);

// Payment related models
db.Payment = require('./payment')(sequelize, DataTypes);
db.PayoutAccount = require('./payoutAccount')(sequelize, DataTypes);

// Review system models
db.Review = require('./review')(sequelize, DataTypes);
db.ReviewResponse = require('./reviewResponse')(sequelize, DataTypes);
db.ReviewReport = require('./reviewReport')(sequelize, DataTypes);

// Search and discovery models
db.SearchHistory = require('./searchHistory')(sequelize, DataTypes);
db.SearchFilter = require('./searchFilter')(sequelize, DataTypes);

// Communication models
db.Message = require('./message')(sequelize, DataTypes);
db.Conversation = require('./conversation')(sequelize, DataTypes);
db.ConversationParticipant = require('./conversationParticipant')(sequelize, DataTypes);
db.MessageAttachment = require('./messageAttachment')(sequelize, DataTypes);
db.Notification = require('./notification')(sequelize, DataTypes);

// Analytics models
db.ViewCount = require('./viewCount')(sequelize, DataTypes);
db.ClickCount = require('./clickCount')(sequelize, DataTypes);

// System models
db.SystemSetting = require('./systemSetting')(sequelize, DataTypes);
db.Maintenance = require('./maintenance')(sequelize, DataTypes);
db.Report = require('./report')(sequelize, DataTypes);

/* ---------- Relationships ---------- */
// First, ensure all models are initialized
const models = Object.values(db).filter(model => model?.associate);

// Then set up associations
models.forEach((model) => {
    if (model?.associate) model.associate(db);
});

/* ---------- Dev helper: init ---------- */
db.init = async (alter = false) => {
    try {
        await sequelize.authenticate();
        console.log('✅  Database connected successfully');

        // Create tables one by one in order of dependencies
        // Core models
        await db.Role.sync({ alter });
        await db.User.sync({ alter });
        await db.UserRoles.sync({ alter });
        
        // Verification models
        await db.Verification.sync({ alter });
        await db.Document.sync({ alter });
        await db.HostProfile.sync({ alter });
        
        // Property related models
        await db.PropertyType.sync({ alter });
        await db.RoomType.sync({ alter });
        await db.Category.sync({ alter });
        await db.Location.sync({ alter });
        await db.Amenity.sync({ alter });
        await db.Listing.sync({ alter });
        await db.ListingAmenities.sync({ alter });
        await db.Photo.sync({ alter });
        await db.PropertyRule.sync({ alter });
        await db.PropertyPolicy.sync({ alter });
        await db.PropertyAvailability.sync({ alter });
        
        // Booking and pricing models
        await db.PriceRule.sync({ alter });
        await db.SeasonalPricing.sync({ alter });
        await db.Booking.sync({ alter });
        await db.BookingRequest.sync({ alter });
        await db.BookingChange.sync({ alter });
        await db.BookingCancellation.sync({ alter });
        await db.BookingCalendar.sync({ alter });
        
        // Host management models
        await db.HostVerification.sync({ alter });
        await db.HostEarnings.sync({ alter });
        
        // Guest management models
        await db.GuestProfile.sync({ alter });
        await db.GuestPreferences.sync({ alter });
        await db.GuestVerification.sync({ alter });
        
        // Payment related models
        await db.Payment.sync({ alter });
        await db.PayoutAccount.sync({ alter });
        
        // Review system models
        await db.Review.sync({ alter });
        await db.ReviewResponse.sync({ alter });
        await db.ReviewReport.sync({ alter });
        
        // Search and discovery models
        await db.SearchFilter.sync({ alter });
        await db.SearchHistory.sync({ alter });
        
        // Communication models
        await db.Conversation.sync({ alter });
        await db.ConversationParticipant.sync({ alter });
        await db.Message.sync({ alter });
        await db.MessageAttachment.sync({ alter });
        await db.Notification.sync({ alter });
        
        // Analytics models
        await db.ViewCount.sync({ alter });
        await db.ClickCount.sync({ alter });
        
        // System models
        await db.SystemSetting.sync({ alter });
        await db.Maintenance.sync({ alter });
        await db.Report.sync({ alter });

        console.log('✅  Tables synced successfully');
    } catch (err) {
        console.error('❌  Database initialization failed:', err);
        throw err;
    }
};


module.exports = db;  
/**
 * First, initialize Sequelize (if you haven't already):
npm run db:init
Then run your migrations:

This will:
Create the necessary tables in your database
Set up all the relationships
Apply any changes from your migration files
The advantage of using migrations over db.init(true) is that:
It's safer for production
It keeps track of database changes
It allows for rollbacks if needed
It's version controlled
If you ever need to:
Undo a migration: npm run migrate:undo
Run seed data: npm run seed
Undo seed data: npm run seed:undo
 */