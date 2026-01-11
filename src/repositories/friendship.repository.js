const Friendship = require('../models/Friendship');

class FriendshipRepository {
    async findExisting(uuid1, uuid2) {
        return await Friendship.findOne({
            $or: [
                { requesterUUID: uuid1, recipientUUID: uuid2 },
                { requesterUUID: uuid2, recipientUUID: uuid1 }
            ]
        });
    }

    async findPendingRequest(requesterUUID, recipientUUID) {
         return await Friendship.findOne({
            requesterUUID,
            recipientUUID,
            status: 'pending'
        });
    }

    async create(data) {
        return await Friendship.create(data);
    }
    
    async save(friendship) {
        return await friendship.save();
    }
    
    async findFriends(uuid) {
        return await Friendship.find({
            $or: [{ requesterUUID: uuid }, { recipientUUID: uuid }],
            status: 'accepted'
        });
    }

    async findRequests(recipientUUID) {
        return await Friendship.find({
            recipientUUID: recipientUUID,
            status: 'pending'
        }).sort({ requestedAt: -1 });
    }

    async findBlocked(requesterUUID, recipientUUID) {
         return await Friendship.findOne({
            requesterUUID,
            recipientUUID,
            status: 'blocked'
        });
    }

    async delete(id) {
        return await Friendship.findByIdAndDelete(id);
    }
}
module.exports = new FriendshipRepository();
