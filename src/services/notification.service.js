const notificationRepository = require('../repositories/notification.repository');
const { getIO } = require('../socket');
const logger = require('../utils/logger');

class NotificationService {
    
    async createNotification(recipientUUID, type, content, data = {}) {
        const notification = await notificationRepository.create({
            recipientUUID,
            type,
            ...content, // { title, body, imageUrl }
            targetType: data.targetType,
            targetId: data.targetId,
            actorUUID: data.actorUUID,
            content: {
                ...content,
                data
            }
        });

        // Real-time delivery
        try {
            const io = getIO();
            io.to(`user:${recipientUUID}`).emit('notification:new', notification);
        } catch (err) {
            logger.warn('Socket not initialized for notification');
        }

        return notification;
    }

    async getNotifications(userUUID, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        return await notificationRepository.findByUser(userUUID, skip, limit);
    }

    async markRead(userUUID, notificationId) {
        if (!notificationId) {
            // Mark all read
            await notificationRepository.markAllRead(userUUID);
            return { count: 'all' };
        }

        const notif = await notificationRepository.update(
            notificationId,
            userUUID,
            { isRead: true, readAt: new Date() }
        );
        return notif;
    }
}

module.exports = new NotificationService();
