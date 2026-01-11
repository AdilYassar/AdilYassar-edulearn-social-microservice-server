const messageRequestRepository = require('../repositories/message-request.repository');
const conversationRepository = require('../repositories/conversation.repository');
const messageRepository = require('../repositories/message.repository');
const userRepository = require('../repositories/user.repository');

class MessageRequestService {

    async getRequests(userUUID) {
        // Pending requests sent TO this user
        const requests = await messageRequestRepository.findPending(userUUID);

        // Populate Sender
        const senderUUIDs = requests.map(r => r.senderUUID);
        const senders = await userRepository.findMany(senderUUIDs);

        // Populate First Message (if exists)
        const messageIds = requests.map(r => r.firstMessageId).filter(id => id);
        // Note: messageRepository.findById returns single, ideally need findMany in repo.
        // For now loop or add findMany to message repo. 
        // Or assume message content is in request "message" field primarily for preview.
        // Existing repo doesn't have findManyMessages.
        // Let's rely on 'message' string field in request which is copied.
        
        return requests.map(r => {
            const sender = senders.find(s => s.quizServerUUID === r.senderUUID);
            return {
                ...r,
                sender: sender ? {
                    name: sender.name,
                    avatar: sender.avatar,
                    quizServerUUID: sender.quizServerUUID
                } : { name: 'Unknown', quizServerUUID: r.senderUUID }
            };
        });
    }

    async createRequest(senderUUID, recipientUUID, messageContent, type = 'text') {
        const request = await messageRequestRepository.create({
            senderUUID,
            recipientUUID,
            status: 'pending',
            message: type === 'text' ? messageContent.text : '[Media]'
        });
        return request;
    }

    async acceptRequest(userUUID, requestId) {
        const request = await messageRequestRepository.findById(requestId);
        if (!request) throw new Error('Request not found');
        if (request.recipientUUID !== userUUID) throw new Error('Unauthorized');

        if (request.status !== 'pending') throw new Error('Request already processed');

        // 1. Create Conversation
        let conversation = await conversationRepository.findDirect(request.senderUUID, request.recipientUUID);

        if (!conversation) {
            conversation = await conversationRepository.create({
                type: 'direct',
                participantUUIDs: [request.senderUUID, request.recipientUUID],
                initiatorUUID: request.senderUUID,
                unreadCounts: [
                  { userUUID: request.senderUUID, count: 0 },
                  { userUUID: request.recipientUUID, count: 0 }
                ]
            });
        }

        // 2. Update Request
        request.status = 'accepted';
        request.conversationId = conversation._id;
        request.respondedAt = new Date();
        await messageRequestRepository.save(request);

        return { status: 'accepted', conversation };
    }

    async rejectRequest(userUUID, requestId) {
        const request = await messageRequestRepository.findById(requestId);
        if (!request) throw new Error('Request not found');
        if (request.recipientUUID !== userUUID) throw new Error('Unauthorized');

        request.status = 'rejected';
        request.respondedAt = new Date();
        await messageRequestRepository.save(request);

        return { status: 'rejected' };
    }
}

module.exports = new MessageRequestService();
