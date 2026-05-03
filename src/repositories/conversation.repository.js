const Conversation = require('../models/Conversation');

class ConversationRepository {
    async findDirect(userUUID1, userUUID2) {
        return await Conversation.findOne({
            type: 'direct',
            participantUUIDs: { $all: [userUUID1, userUUID2] }
        });
    }

    async findByUser(userUUID) {
        return await Conversation.find({
            participantUUIDs: userUUID,
            isArchived: false
        }).sort({ updatedAt: -1 });
    }

    async create(data) {
        return await Conversation.create(data);
    }

    async findById(id) {
        return await Conversation.findById(id);
    }

    async update(id, data) {
        return await Conversation.findByIdAndUpdate(id, data, { new: true });
    }
}
module.exports = new ConversationRepository();
