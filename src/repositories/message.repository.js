const Message = require('../models/Message');

class MessageRepository {
    async findByConversation(conversationId, skip, limit) {
        return await Message.find({ conversationId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate({
            path: 'content.postId',
            populate: { path: 'author' } // This gets the user who created the post
          });
    }
    
    async create(data) {
        return await Message.create(data);
    }
    
    async findById(id) {
        return await Message.findById(id);
    }
    
    async delete(id) {
        return await Message.findByIdAndDelete(id); // Soft delete handled in model logic usually, but here simple
    }
}
module.exports = new MessageRepository();
