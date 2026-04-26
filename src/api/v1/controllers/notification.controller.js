const notificationService = require('../../../services/notification.service');
const firebaseNotificationService = require('../../../services/firebase-notification.service');
const logger = require('../../../utils/logger');

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

/**
 * Register device token for push notifications
 */
exports.registerDeviceToken = async (req, res) => {
    try {
        const { token, deviceType, deviceName, osVersion, appVersion, email } = req.body;

        if (!token) {
            return res.status(400).json({ status: 'error', message: 'Device token is required' });
        }

        const device = await firebaseNotificationService.registerDeviceToken(
            req.user.quizServerUUID,
            token,
            { deviceType, deviceName, osVersion, appVersion, email }
        );

        res.status(200).json({
            status: 'success',
            message: 'Device token registered',
            data: device
        });
    } catch (error) {
        logger.error('Error registering device token:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Unregister device token
 */
exports.unregisterDeviceToken = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ status: 'error', message: 'Device token is required' });
        }

        await firebaseNotificationService.unregisterDeviceToken(token);
        res.status(200).json({ status: 'success', message: 'Device token unregistered' });
    } catch (error) {
        logger.error('Error unregistering device token:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};
