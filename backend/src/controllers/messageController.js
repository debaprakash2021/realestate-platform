const MessageService   = require('../services/messageService');
const ResponseHandler  = require('../utils/responseHandler');

class MessageController {

  // POST /api/messages/conversation
  static async startConversation(req, res) {
    try {
      const { propertyId, bookingId } = req.body;
      const conversation = await MessageService.getOrCreateConversation(
        req.user.id, propertyId, bookingId
      );
      return ResponseHandler.success(res, conversation, 'Conversation ready', 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // POST /api/messages/:conversationId
  static async sendMessage(req, res) {
    try {
      const message = await MessageService.sendMessage(
        req.user.id,
        req.params.conversationId,
        req.body.content
      );
      return ResponseHandler.success(res, message, 'Message sent', 201);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // GET /api/messages/:conversationId
  static async getMessages(req, res) {
    try {
      const result = await MessageService.getMessages(
        req.user.id,
        req.params.conversationId,
        req.query
      );
      return ResponseHandler.success(res, result);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // GET /api/messages/conversations
  static async getMyConversations(req, res) {
    try {
      const conversations = await MessageService.getMyConversations(req.user.id);
      return ResponseHandler.success(res, conversations);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 500);
    }
  }

  // GET /api/messages/conversations/:conversationId
  static async getConversation(req, res) {
    try {
      const conversation = await MessageService.getConversation(
        req.user.id,
        req.params.conversationId
      );
      return ResponseHandler.success(res, conversation);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }

  // DELETE /api/messages/:messageId
  static async deleteMessage(req, res) {
    try {
      const result = await MessageService.deleteMessage(
        req.user.id,
        req.params.messageId
      );
      return ResponseHandler.success(res, result);
    } catch (error) {
      return ResponseHandler.error(res, error.message, 400);
    }
  }
}

module.exports = MessageController;