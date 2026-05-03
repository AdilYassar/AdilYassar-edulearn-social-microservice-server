const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationRepository {
    async findByUser(userUUID, skip, limit) {
        const notifications = await Notification.find({ recipientUUID: userUUID })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Batch-fetch all actor profiles in a single query (no N+1)
        const actorUUIDs = [...new Set(notifications.map(n => n.actorUUID).filter(Boolean))];
        const actors = await User.find({ quizServerUUID: { $in: actorUUIDs } })
            .select('quizServerUUID name avatar')
            .lean();
        const actorMap = Object.fromEntries(actors.map(u => [u.quizServerUUID, u]));

        // Normalize the response shape for the frontend
        return notifications.map(n => ({
            ...n,
            actor: n.actorUUID ? (actorMap[n.actorUUID] || null) : null,
            content: {
                message: n.content?.body || n.content?.title || '',
                postId:     n.content?.data?.postId     || n.targetId || null,
                commentId:  n.content?.data?.commentId  || null,
                groupId:    n.content?.data?.groupId    || null,
            }
        }));
    }
    
    async create(data) {
        return await Notification.create(data);
    }

    async update(id, userUUID, updates) {
        return await Notification.findOneAndUpdate(
            { _id: id, recipientUUID: userUUID },
            updates,
            { new: true }
        );
    }

    async markAllRead(userUUID) {
        return await Notification.updateMany(
            { recipientUUID: userUUID, isRead: false },
            { isRead: true, readAt: new Date() }
        );
    }
}
module.exports = new NotificationRepository();
