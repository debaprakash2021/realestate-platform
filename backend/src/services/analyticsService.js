const Booking  = require('../models/Booking');
const Property = require('../models/Property');
const Review   = require('../models/Review');
const Payment  = require('../models/Payment');
const User     = require('../models/User');

class AnalyticsService {

  // ─── Host Dashboard Overview ──────────────────────────────────────
  static async getHostDashboard(hostId) {
    const properties = await Property.find({ host: hostId });
    const propertyIds = properties.map(p => p._id);

    const [
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      totalReviews,
      payments
    ] = await Promise.all([
      Booking.countDocuments({ host: hostId }),
      Booking.countDocuments({ host: hostId, status: 'confirmed' }),
      Booking.countDocuments({ host: hostId, status: 'completed' }),
      Booking.countDocuments({ host: hostId, status: 'cancelled' }),
      Review.countDocuments({ property: { $in: propertyIds } }),
      Payment.find({ host: hostId, status: { $in: ['held', 'released'] } })
    ]);

    const totalRevenue  = payments
      .filter(p => p.status === 'released')
      .reduce((sum, p) => sum + p.amount.hostPayout, 0);

    const pendingPayout = payments
      .filter(p => p.status === 'held')
      .reduce((sum, p) => sum + p.amount.hostPayout, 0);

    const avgRating = properties.length
      ? (properties.reduce((sum, p) => sum + p.ratings.average, 0) / properties.length).toFixed(1)
      : 0;

    return {
      overview: {
        totalProperties:   properties.length,
        activeProperties:  properties.filter(p => p.status === 'active').length,
        totalBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        totalReviews,
        avgRating:         Number(avgRating),
        totalRevenue,
        pendingPayout
      }
    };
  }

  // ─── Revenue Analytics ────────────────────────────────────────────
  static async getRevenueAnalytics(hostId, period = 'monthly') {
    const now      = new Date();
    const start    = new Date();

    if (period === 'weekly')  start.setDate(now.getDate() - 7);
    if (period === 'monthly') start.setMonth(now.getMonth() - 6);
    if (period === 'yearly')  start.setFullYear(now.getFullYear() - 1);

    const payments = await Payment.find({
      host:      hostId,
      status:    'released',
      createdAt: { $gte: start }
    }).populate('booking', 'checkIn checkOut nights');

    // Group by month
    const revenueByMonth = {};
    payments.forEach(p => {
      const month = p.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!revenueByMonth[month]) revenueByMonth[month] = 0;
      revenueByMonth[month] += p.amount.hostPayout;
    });

    const revenueData = Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month,
      revenue
    })).sort((a, b) => a.month.localeCompare(b.month));

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount.hostPayout, 0);
    const avgPerBooking = payments.length ? Math.round(totalRevenue / payments.length) : 0;

    return {
      period,
      totalRevenue,
      avgPerBooking,
      totalPayments: payments.length,
      revenueData
    };
  }

  // ─── Booking Analytics ────────────────────────────────────────────
  static async getBookingAnalytics(hostId) {
    const bookings = await Booking.find({ host: hostId })
      .populate('property', 'title');

    // Bookings by status
    const byStatus = {
      confirmed:  bookings.filter(b => b.status === 'confirmed').length,
      completed:  bookings.filter(b => b.status === 'completed').length,
      cancelled:  bookings.filter(b => b.status === 'cancelled').length,
      pending:    bookings.filter(b => b.status === 'pending').length
    };

    // Bookings per property
    const byProperty = {};
    bookings.forEach(b => {
      if (!b.property) return;
      const title = b.property.title;
      if (!byProperty[title]) byProperty[title] = 0;
      byProperty[title]++;
    });

    const byPropertyData = Object.entries(byProperty).map(([property, count]) => ({
      property,
      count
    }));

    // Average nights per booking
    const avgNights = bookings.length
      ? (bookings.reduce((sum, b) => sum + (b.nights || 0), 0) / bookings.length).toFixed(1)
      : 0;

    return {
      total:      bookings.length,
      byStatus,
      byProperty: byPropertyData,
      avgNights:  Number(avgNights)
    };
  }

  // ─── Property Performance ─────────────────────────────────────────
  static async getPropertyPerformance(hostId) {
    const properties = await Property.find({ host: hostId });

    const performance = await Promise.all(properties.map(async (p) => {
      const [bookingCount, reviewCount, revenue] = await Promise.all([
        Booking.countDocuments({ property: p._id, status: { $in: ['confirmed', 'completed'] } }),
        Review.countDocuments({ property: p._id }),
        Payment.aggregate([
          { $match: { host: hostId, status: 'released' } },
          { $group: { _id: null, total: { $sum: '$amount.hostPayout' } } }
        ])
      ]);

      return {
        propertyId:    p._id,
        title:         p.title,
        status:        p.status,
        rating:        p.ratings.average,
        reviewCount,
        bookingCount,
        revenue:       revenue[0]?.total || 0,
        favoriteCount: p.stats.favoriteCount,
        viewCount:     p.stats.viewCount
      };
    }));

    return performance;
  }

  // ─── Admin Platform Stats ─────────────────────────────────────────
  static async getPlatformStats() {
    const [
      totalUsers,
      totalHosts,
      totalGuests,
      totalProperties,
      totalBookings,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'host' }),
      User.countDocuments({ role: 'guest' }),
      Property.countDocuments(),
      Booking.countDocuments(),
      Payment.aggregate([
        { $match: { status: 'released' } },
        { $group: { _id: null, total: { $sum: '$amount.platformFee' } } }
      ])
    ]);

    return {
      totalUsers,
      totalHosts,
      totalGuests,
      totalProperties,
      totalBookings,
      platformRevenue: totalRevenue[0]?.total || 0
    };
  }
}

module.exports = AnalyticsService;