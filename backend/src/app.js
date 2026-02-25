const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

// Route imports
const authRoutes     = require('./routes/authRoutes');
const propertyRoutes = require('./routes/Propertyroutes');
const bookingRoutes  = require('./routes/bookingRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const messageRoutes = require('./routes/messageRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Create logs directory if it doesn't exist
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Initialize app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'RealEstate API is running 🏠',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ─── API Routes ─────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings',   bookingRoutes);
app.use('/api/upload',     uploadRoutes);
app.use('/api/reviews',    reviewRoutes);   
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);
// More routes will be added here as we build each phase:
// app.use('/api/bookings',        bookingRoutes);      // Phase 3
// app.use('/api/reviews',         reviewRoutes);       // Phase 5
// app.use('/api/messages',        messageRoutes);      // Phase 6
// app.use('/api/payments',        paymentRoutes);      // Phase 7
// app.use('/api/favorites',       favoriteRoutes);     // Phase 8
// app.use('/api/notifications',   notificationRoutes); // Phase 9
// app.use('/api/analytics',       analyticsRoutes);    // Phase 10

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;