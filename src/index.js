require('dotenv').config();          // Load .env first
require('express-async-errors');     // Catch async errors globally

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const config  = require('./config/config');
const{ db  }    = require('./models'); // Import Sequelize models
const { uploadSingle } = require('./middleware/upload');

// Routes
const listingRoutes = require('./routes/listingRoutes');
const authRoutes    = require('./routes/authRoutes');

const app = express();

/* ───────────── Global middleware ───────────── */
app.use(helmet()); // Security headers
app.use(cors({
    origin: config.appUrl, // Allow requests from your frontend
    credentials: true      // Allow cookies/sessions
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

// Test upload route
app.patch('/test-upload', uploadSingle, (req, res) => {
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

