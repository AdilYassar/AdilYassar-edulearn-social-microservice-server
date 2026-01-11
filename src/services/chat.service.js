const conversationRepository = require('../repositories/conversation.repository');
const messageRepository = require('../repositories/message.repository');
const userRepository = require('../repositories/user.repository');
const logger = require('../utils/logger');
const { getIO } = require('../socket');

class ChatService {
  
  async createDirectConversation(userUUID1, userUUID2) {
    if (userUUID1 === userUUID2) throw new Error('Cannot chat with self');

    // Check if exists
    let conversation = await conversationRepository.findDirect(userUUID1, userUUID2);

    if (conversation) return conversation;

    // Create new
    conversation = await conversationRepository.create({
      type: 'direct',
      participantUUIDs: [userUUID1, userUUID2],
      initiatorUUID: userUUID1,
      unreadCounts: [
        { userUUID: userUUID1, count: 0 },
        { userUUID: userUUID2, count: 0 }
      ]
    });

    return conversation;
  }

  async getConversations(userUUID) {
    const conversations = await conversationRepository.findByUser(userUUID);
    const results = [];

    // Populate participant details manually
    for (let conv of conversations) {
        // Convert to object if it's a mongoose doc
        const convObj = conv.toObject ? conv.toObject() : conv;
        
        if (convObj.type === 'direct') {
            const otherUUID = convObj.participantUUIDs.find(id => id !== userUUID);
            if (otherUUID) {
                // FindOne from Repo
                const otherUser = await userRepository.findByUUID(otherUUID);
                if (otherUser) {
                    convObj.otherUser = {
                        name: otherUser.name,
                        avatar: otherUser.avatar,
                        isOnline: otherUser.isOnline,
                        lastSeen: otherUser.lastSeen
                    };
                }
            }
        }
        results.push(convObj);
    }

    return results;
  }

  async getMessages(conversationId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    // Check if conversation exists (optional validation)
    // const conversation = await conversationRepository.findById(conversationId);
    // if (!conversation) throw new Error('Conversation not found');

    const messages = await messageRepository.findByConversation(conversationId, skip, limit);
    return messages.reverse();
  }

  async sendMessage(senderUUID, conversationId, content, type = 'text') {
    const conversation = await conversationRepository.findById(conversationId);

    if (!conversation) throw new Error('Conversation not found');
    if (!conversation.participantUUIDs.includes(senderUUID)) throw new Error('Access denied');

    const message = await messageRepository.create({
        conversationId,
        senderUUID,
        type,
        content,
        // formattedContent: type === 'text' ? content.text : 'Media' 
    });

    // Update conversation lastMessage
    conversation.lastMessage = {
        messageId: message._id,
        senderUUID,
        preview: type === 'text' ? content.text.substring(0, 50) : `[${type}]`,
        timestamp: new Date(),
        type
    };
    
    // Increment unread counts
    conversation.unreadCounts.forEach(uc => {
        if (uc.userUUID !== senderUUID) {
            uc.count += 1;
        }
    });

    await conversation.save(); // Relying on Mongoose document save

    // Emit Socket Event
    try {
        const io = getIO();
        io.to(`conversation:${conversationId}`).emit('message:new', message);
        
        conversation.participantUUIDs.forEach(uuid => {
             if (uuid !== senderUUID) {
                 io.to(`user:${uuid}`).emit('conversation:update', conversation);
             }
        });

    } catch (err) {
        logger.error(`Socket emit failed: ${err.message}`);
    }

    return message;
  }

  async muteConversation(userUUID, conversationId) {
      const conversation = await conversationRepository.findById(conversationId);
      if (!conversation) throw new Error('Conversation not found');
      if (!conversation.participantUUIDs.includes(userUUID)) throw new Error('Access denied');

      if (!conversation.mutedBy.includes(userUUID)) {
          conversation.mutedBy.push(userUUID);
          await conversation.save();
      }
      return { status: 'muted' };
  }

  async markAsRead(userUUID, conversationId) {
      const conversation = await conversationRepository.findById(conversationId);
      if (!conversation) throw new Error('Conversation not found');

      const userCount = conversation.unreadCounts.find(uc => uc.userUUID === userUUID);
      if (userCount) {
          userCount.count = 0;
          await conversation.save();
      }
      
      return { status: 'read' };
  }

  async addReaction(userUUID, messageId, emoji) {
      const message = await messageRepository.findById(messageId);
      if (!message) throw new Error('Message not found');

      message.reactions.push({
          userUUID,
          emoji,
          timestamp: new Date()
      });
      await message.save();
      
       try {
        const io = getIO();
        io.to(`conversation:${message.conversationId}`).emit('message:reaction', { messageId, userUUID, emoji });
       } catch(e) {}

      return message;
  }
}

module.exports = new ChatService();
