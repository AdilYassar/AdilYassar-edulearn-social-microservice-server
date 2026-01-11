const notificationService = require('../../../services/notification.service');

exports.getNotifications = async (req, res) => {
    try {
        const { page } = req.query;
        const notifications = await notificationService.getNotifications(req.user.quizServerUUID, parseInt(page));
        res.status(200).json({ status: 'success', data: notifications });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.markRead = async (req, res) => {
    try {
        const { notificationId } = req.params; // Optional, if null marks all
        const result = await notificationService.markRead(req.user.quizServerUUID, notificationId);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};
