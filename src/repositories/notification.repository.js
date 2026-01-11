const Notification = require('../models/Notification');

class NotificationRepository {
    async findByUser(userUUID, skip, limit) {
        return await Notification.find({ recipientUUID: userUUID })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
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
