require('dotenv').config();          // Load .env first
require('express-async-errors');     // Catch async errors globally

const express = require('express');
const http = require('http');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const config  = require('./config/config');
const webpush = require('web-push'); // Add web-push
const { initializeSocket } = require('./socket');

const db      = require('./models'); // Import Sequelize models
//const { uploadSingle } = require('./middleware/upload');
const { uploadMultiple } = require('./middleware/upload');

// Configure web-push with VAPID keys
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Routes
const listingRoutes = require('./routes/listingRoutes');
const authRoutes    = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const verify  = require('./routes/VerificationCodeRoutes')
const hostApplicationRoutes = require('./routes/hostApplicationRoutes');
const hostRoutes = require('./routes/hostRoutes');
const guestRoutes = require('./routes/guestRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Add admin routes
const reviewRoutes = require('./routes/reviewRoutes'); // Add review routes
const notificationRoutes = require('./routes/notificationRoutes');
const searchRoutes = require('./routes/searchRoutes');
const pushNotificationRoutes = require('./routes/pushNotificationRoutes'); // Add this line
const messageRoutes = require('./routes/messageRoutes'); // Add message routes

const app = express();

/* ───────────── Global middleware ───────────── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Security headers with CORP configuration

app.use(cors({
    origin: '*', // Allow all origins during development
    credentials: true      // Allow cookies/sessions
}));
app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '10kb' })); // Parse JSON bodies with size limit

/* ───────────── Static files with CORS headers ───────────── */
// Configure CORS headers specifically for static files in uploads directory
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static('uploads'));

/* ───────────── Health check ───────────── */
app.get('/', (_, res) =>
    res.json({ 
        message: 'Welcome to the House Booking API',
        version: '1.0.0',
        status: 'healthy'
    })
);

/* ───────────── Database connection ───────────── */
db.init()
  .then(() => {
    console.log('✅  Database connected and initialized successfully');
  })
  .catch((error) => {
    console.error('❌  Database connection failed:', error);
  });

/* ───────────── API routes ───────────── */
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use("/api/verify", verify)
app.use('/api/host', hostApplicationRoutes);
app.use('/api/host', hostRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/admin', adminRoutes); // Add admin routes
app.use('/api/reviews', reviewRoutes); // Add review routes
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/push', pushNotificationRoutes); // Add this line
app.use('/api/messages', messageRoutes); // Add message routes

// Test upload route
app.patch('/test-upload', uploadMultiple, (req, res) => {
  console.log('⚡ req.file:', req.file);
  console.log('⚡ req.body:', req.body);
  return res.json({ received: Boolean(req.file), file: req.file });
});

/* ───────────── 404 fallback ───────────── */
app.use((_, res) => res.status(404).json({ 
    message: 'Route not found',
    error: 'Not Found'
}));

/* ───────────── Error handler ───────────── */
app.use((err, req, res, _next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        status: 'error'
    });
});

/* ───────────── Boot sequence ───────────── */
const PORT = config.port || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with the HTTP server
const io = initializeSocket(server);

// Make io accessible to routes if needed
app.set('io', io);

// Start the server
server.listen(PORT, () => {
    console.log(`🚀  API + Socket running on http://localhost:${PORT}`);
    console.log(`📚  API Documentation: http://localhost:${PORT}/api-docs`);
});

