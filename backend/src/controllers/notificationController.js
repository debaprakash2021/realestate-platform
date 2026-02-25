const NotificationService = require('../services/notificationService');
const ResponseHandler     = require('../utils/responseHandler');

class NotificationController {

  // GET /api/notifications
  static async getMyNotifications(req, res) {
    try {
      const result = await NotificationService.getMyNotifications(req.user.id, req.query);
      return ResponseHandler.success(res, result);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // GET /api/notifications/unread-count
  static async getUnreadCount(req, res) {
    try {
      const result = await NotificationService.getUnreadCount(req.user.id);
      return ResponseHandler.success(res, result);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // PUT /api/notifications/:id/read
  static async markAsRead(req, res) {
    try {
      const result = await NotificationService.markAsRead(req.user.id, req.params.id);
      return ResponseHandler.success(res, result, 'Notification marked as read');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // PUT /api/notifications/mark-all-read
  static async markAllAsRead(req, res) {
    try {
      const result = await NotificationService.markAllAsRead(req.user.id);
      return ResponseHandler.success(res, result, 'All notifications marked as read');
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // DELETE /api/notifications/:id
  static async deleteNotification(req, res) {
    try {
      const result = await NotificationService.deleteNotification(req.user.id, req.params.id);
      return ResponseHandler.success(res, result);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // POST /api/notifications/send-test  (for testing only)
  static async sendTestNotification(req, res) {
    try {
      const { type, title, message } = req.body;
      const notification = await NotificationService.create(
        req.user.id,
        type || 'system',
        title || 'Test Notification',
        message || 'This is a test notification from the system.'
      );
      return ResponseHandler.success(res, notification, 'Test notification sent', 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }
}

module.exports = NotificationController;