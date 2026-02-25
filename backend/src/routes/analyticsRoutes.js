const express              = require('express');
const AnalyticsController  = require('../controllers/analyticsController');
const authMiddleware       = require('../middlewares/authMiddleware');
const roleMiddleware       = require('../middlewares/roleMiddleware');

const router = express.Router();

// All routes require login
router.use(authMiddleware);

// ─── Host Analytics ───────────────────────────────────────────────
router.get('/host/dashboard',   AnalyticsController.getHostDashboard);      // Overview
router.get('/host/revenue',     AnalyticsController.getRevenueAnalytics);   // Revenue
router.get('/host/bookings',    AnalyticsController.getBookingAnalytics);   // Bookings
router.get('/host/properties',  AnalyticsController.getPropertyPerformance);// Per property

// ─── Admin Analytics ──────────────────────────────────────────────
router.get('/admin/platform', roleMiddleware('admin'), AnalyticsController.getPlatformStats);

module.exports = router;