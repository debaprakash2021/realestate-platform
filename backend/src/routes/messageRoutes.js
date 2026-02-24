const express           = require('express');
const MessageController = require('../controllers/messageController');
const authMiddleware    = require('../middlewares/authMiddleware');

const router = express.Router();

// All message routes require login
router.use(authMiddleware);

// ─── Conversation Routes ──────────────────────────────────────────
router.post('/conversation',                    MessageController.startConversation);   // Start/get conversation
router.get('/conversations',                    MessageController.getMyConversations);  // My conversations
router.get('/conversations/:conversationId',    MessageController.getConversation);     // Single conversation

// ─── Message Routes ───────────────────────────────────────────────
router.post('/:conversationId',                 MessageController.sendMessage);         // Send message
router.get('/:conversationId',                  MessageController.getMessages);         // Get messages
router.delete('/message/:messageId',            MessageController.deleteMessage);       // Delete message

module.exports = router;