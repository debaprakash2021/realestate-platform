const Conversation = require('../models/Conversation');
const Message      = require('../models/Message');
const Property     = require('../models/Property');

class MessageService {

  // ─── Get or Create Conversation ──────────────────────────────────
  static async getOrCreateConversation(guestId, propertyId, bookingId = null) {
    // Find property to get host
    const property = await Property.findById(propertyId);
    if (!property) throw new Error('Property not found');

    const hostId = property.host;

    // Guest cannot message themselves
    if (hostId.toString() === guestId.toString()) {
      throw new Error('You cannot message yourself');
    }

    // Find existing or create new
    let conversation = await Conversation.findOne({
      host:     hostId,
      guest:    guestId,
      property: propertyId
    });

    if (!conversation) {
      conversation = await Conversation.create({
        host:     hostId,
        guest:    guestId,
        property: propertyId,
        booking:  bookingId
      });
    }

    return await conversation.populate([
      { path: 'host',     select: 'name avatar' },
      { path: 'guest',    select: 'name avatar' },
      { path: 'property', select: 'title location images' }
    ]);
  }

  // ─── Send Message ─────────────────────────────────────────────────
  static async sendMessage(senderId, conversationId, content) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    // Verify sender is a participant
    const isHost  = conversation.host.toString()  === senderId.toString();
    const isGuest = conversation.guest.toString() === senderId.toString();
    if (!isHost && !isGuest) throw new Error('Not authorized');

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender:       senderId,
      content
    });

    // Update conversation last message + unread count
    const recipientRole = isHost ? 'guest' : 'host';
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        content,
        sender:    senderId,
        createdAt: new Date()
      },
      $inc: { [`unreadCount.${recipientRole}`]: 1 }
    });

    return await message.populate('sender', 'name avatar');
  }

  // ─── Get Messages in Conversation ────────────────────────────────
  static async getMessages(userId, conversationId, query = {}) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    // Verify user is a participant
    const isHost  = conversation.host.toString()  === userId.toString();
    const isGuest = conversation.guest.toString() === userId.toString();
    if (!isHost && !isGuest) throw new Error('Not authorized');

    const { page = 1, limit = 20 } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId, isDeleted: false })
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Message.countDocuments({ conversation: conversationId, isDeleted: false })
    ]);

    // Mark messages as read
    const userRole = isHost ? 'host' : 'guest';
    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCount.${userRole}`]: 0
    });
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: userId }, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return {
      messages: messages.reverse(), // oldest first
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    };
  }

  // ─── Get My Conversations ─────────────────────────────────────────
  static async getMyConversations(userId) {
    const conversations = await Conversation.find({
      $or: [{ host: userId }, { guest: userId }],
      isActive: true
    })
      .populate('host',     'name avatar')
      .populate('guest',    'name avatar')
      .populate('property', 'title location images')
      .sort({ updatedAt: -1 });

    return conversations;
  }

  // ─── Get Single Conversation ──────────────────────────────────────
  static async getConversation(userId, conversationId) {
    const conversation = await Conversation.findById(conversationId)
      .populate('host',     'name avatar')
      .populate('guest',    'name avatar')
      .populate('property', 'title location images');

    if (!conversation) throw new Error('Conversation not found');

    const isParticipant =
      conversation.host._id.toString()  === userId.toString() ||
      conversation.guest._id.toString() === userId.toString();

    if (!isParticipant) throw new Error('Not authorized');

    return conversation;
  }

  // ─── Delete Message ───────────────────────────────────────────────
  static async deleteMessage(userId, messageId) {
    const message = await Message.findOne({ _id: messageId, sender: userId });
    if (!message) throw new Error('Message not found or unauthorized');

    message.isDeleted = true;
    message.content   = 'This message was deleted';
    await message.save();

    return { message: 'Message deleted' };
  }
}

module.exports = MessageService;