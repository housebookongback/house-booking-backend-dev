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
        await db.Role.sync();
        await db.User.sync();
        await db.UserRoles.sync();
        await db.PropertyType.sync();
        await db.RoomType.sync();
        await db.Category.sync();
        await db.Location.sync();
        await db.Listing.sync();
        await db.Amenity.sync();
        await db.ListingAmenities.sync();
        await db.Photo.sync();
        await db.PropertyRule.sync();
        await db.PropertyPolicy.sync();
        await db.PropertyAvailability.sync();
        await db.PriceRule.sync();
        await db.SeasonalPricing.sync();
        await db.Booking.sync();
        await db.BookingCalendar.sync();
        await db.Review.sync();
        await db.Report.sync();

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