const express                = require('express');
const NotificationController = require('../controllers/notificationController');
const authMiddleware         = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes require login
router.use(authMiddleware);

// ─── Specific routes BEFORE /:id ──────────────────────────────────
router.get('/',                  NotificationController.getMyNotifications);  // Get all
router.get('/unread-count',      NotificationController.getUnreadCount);      // Unread count
router.put('/mark-all-read',     NotificationController.markAllAsRead);       // Mark all read
router.post('/send-test',        NotificationController.sendTestNotification); // Test only

// ─── Dynamic routes ───────────────────────────────────────────────
router.put('/:id/read',          NotificationController.markAsRead);          // Mark one read
router.delete('/:id',            NotificationController.deleteNotification);  // Delete one

module.exports = router;