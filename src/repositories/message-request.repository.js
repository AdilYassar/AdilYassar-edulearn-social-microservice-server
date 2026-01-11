const MessageRequest = require('../models/MessageRequest');

class MessageRequestRepository {
    async create(data) {
        return await MessageRequest.create(data);
    }

    async findPending(recipientUUID) {
        return await MessageRequest.find({
            recipientUUID,
            status: 'pending'
        }).lean();
    }

    async findById(id) {
        return await MessageRequest.findById(id);
    }
    
    async save(request) {
        return await request.save();
    }
}

module.exports = new MessageRequestRepository();
