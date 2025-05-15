require('dotenv').config();          // Load .env first
require('express-async-errors');     // Catch async errors globally

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const config  = require('./config/config');
; // Import the verify middleware
const db      = require('./models'); // Import Sequelize models
//const { uploadSingle } = require('./middleware/upload');
const { uploadMultiple } = require('./middleware/upload');


// Routes
const listingRoutes = require('./routes/listingRoutes');
const authRoutes    = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const verify  = require('./routes/VerificationCodeRoutes')
const hostRoutes = require('./routes/hostRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Add admin routes

const app = express();

/* ───────────── Global middleware ───────────── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Security headers with CORP configuration

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev')); // Logging
app.use(express.json({ limit: '10kb' })); // Parse JSON bodies with size limit

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

  app.use('/uploads', express.static('uploads'));
/* ───────────── API routes ───────────── */
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use("/api/verify", verify)
app.use('/api/host', hostRoutes);
app.use('/api/admin', adminRoutes); // Add admin routes

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
app.listen(PORT, () => {
    console.log(`🚀  Server is running on http://localhost:${PORT}`);
    console.log(`📚  API Documentation: http://localhost:${PORT}/api-docs`);
});

