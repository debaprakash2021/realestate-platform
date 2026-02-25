const AnalyticsService = require('../services/analyticsService');
const ResponseHandler  = require('../utils/responseHandler');

class AnalyticsController {

  // GET /api/analytics/host/dashboard
  static async getHostDashboard(req, res) {
    try {
      const data = await AnalyticsService.getHostDashboard(req.user.id);
      return ResponseHandler.success(res, data);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // GET /api/analytics/host/revenue?period=monthly
  static async getRevenueAnalytics(req, res) {
    try {
      const data = await AnalyticsService.getRevenueAnalytics(
        req.user.id,
        req.query.period || 'monthly'
      );
      return ResponseHandler.success(res, data);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // GET /api/analytics/host/bookings
  static async getBookingAnalytics(req, res) {
    try {
      const data = await AnalyticsService.getBookingAnalytics(req.user.id);
      return ResponseHandler.success(res, data);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // GET /api/analytics/host/properties
  static async getPropertyPerformance(req, res) {
    try {
      const data = await AnalyticsService.getPropertyPerformance(req.user.id);
      return ResponseHandler.success(res, data);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // GET /api/analytics/admin/platform
  static async getPlatformStats(req, res) {
    try {
      const data = await AnalyticsService.getPlatformStats();
      return ResponseHandler.success(res, data);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }
}

module.exports = AnalyticsController;