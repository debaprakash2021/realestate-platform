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
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const messageRoutes = require('./routes/messageRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Create logs directory if it doesn't exist
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Initialize app
const app = express();

// ─── CORS ───────────────────────────────────────────────────────
// Hard-code both known origins. CLIENT_URL is stripped of any
// accidental path suffix (e.g. /register) before comparison.
const STATIC_ORIGINS = [
  'http://localhost:5173',
  'https://realestate-platform-gamma.vercel.app',
];

// Strip any path/query from CLIENT_URL so a mis-configured Render
// env variable like "https://…vercel.app/register" doesn't leak
// into the Allow-Origin header.
const rawClientUrl = (process.env.CLIENT_URL || '').trim().replace(/\/+$/, '');
if (rawClientUrl) {
  try {
    const parsed = new URL(rawClientUrl);
    const cleanOrigin = parsed.origin; // scheme + host only
    if (!STATIC_ORIGINS.includes(cleanOrigin)) {
      STATIC_ORIGINS.push(cleanOrigin);
    }
  } catch {
    // invalid URL — ignore
  }
}

// ── Startup diagnostic (no secrets logged) ──────────────────────
console.log('[CORS] Allowed origins at startup:', JSON.stringify(STATIC_ORIGINS));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server / curl requests (no Origin header)
    if (!origin) return callback(null, true);
    const allowed = STATIC_ORIGINS.includes(origin);
    console.log(`[CORS] origin="${origin}" allowed=${allowed}`);
    if (allowed) return callback(null, true);
    return callback(new Error(`CORS: origin '${origin}' is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// CORS must be registered BEFORE every other middleware so that
// Access-Control-Allow-Origin is set even on 4xx / 5xx responses.
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security middleware (after CORS so helmet doesn't interfere with preflight)
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: 'Too many requests from this IP, please try again later.',
  // Skip rate limiting entirely in development
  skip: () => process.env.NODE_ENV === 'development',
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Logging — use 'combined' in production for Render log visibility
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
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
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

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