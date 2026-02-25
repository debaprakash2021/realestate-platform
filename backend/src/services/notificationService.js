const Notification = require('../models/Notification');

class NotificationService {

  // ─── Create Notification ──────────────────────────────────────────
  static async create(userId, type, title, message, data = {}) {
    return await Notification.create({
      user: userId,
      type,
      title,
      message,
      data
    });
  }

  // ─── Get My Notifications ─────────────────────────────────────────
  static async getMyNotifications(userId, query = {}) {
    const { page = 1, limit = 20, unreadOnly = false } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { user: userId };
    if (unreadOnly === 'true') filter.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: userId, isRead: false })
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    };
  }

  // ─── Mark Single as Read ──────────────────────────────────────────
  static async markAsRead(userId, notificationId) {
    const notification = await Notification.findOne({
      _id:  notificationId,
      user: userId
    });
    if (!notification) throw new Error('Notification not found');

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
    return notification;
  }

  // ─── Mark All as Read ─────────────────────────────────────────────
  static async markAllAsRead(userId) {
    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return { message: 'All notifications marked as read' };
  }

  // ─── Delete Notification ──────────────────────────────────────────
  static async deleteNotification(userId, notificationId) {
    const notification = await Notification.findOneAndDelete({
      _id:  notificationId,
      user: userId
    });
    if (!notification) throw new Error('Notification not found');
    return { message: 'Notification deleted' };
  }

  // ─── Get Unread Count ─────────────────────────────────────────────
  static async getUnreadCount(userId) {
    const count = await Notification.countDocuments({
      user:   userId,
      isRead: false
    });
    return { unreadCount: count };
  }

  // ─── Helper: Send Booking Notification ───────────────────────────
  static async sendBookingNotification(type, guestId, hostId, bookingId, propertyTitle) {
    const templates = {
      booking_confirmed: {
        guest: { title: '🎉 Booking Confirmed!',    message: `Your booking for ${propertyTitle} is confirmed.` },
        host:  { title: '📅 New Booking Received!', message: `You have a new booking for ${propertyTitle}.` }
      },
      booking_cancelled: {
        guest: { title: '❌ Booking Cancelled',     message: `Your booking for ${propertyTitle} has been cancelled.` },
        host:  { title: '❌ Booking Cancelled',     message: `A booking for ${propertyTitle} has been cancelled.` }
      },
      booking_completed: {
        guest: { title: '✅ Stay Completed!',       message: `We hope you enjoyed your stay at ${propertyTitle}. Leave a review!` },
        host:  { title: '✅ Stay Completed!',       message: `A guest has completed their stay at ${propertyTitle}.` }
      }
    };

    const template = templates[type];
    if (!template) return;

    await Promise.all([
      NotificationService.create(guestId, type, template.guest.title, template.guest.message, { bookingId }),
      NotificationService.create(hostId,  type, template.host.title,  template.host.message,  { bookingId })
    ]);
  }
}

module.exports = NotificationService;