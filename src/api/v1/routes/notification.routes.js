const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// Notification retrieval and management
router.get('/', notificationController.getNotifications);
router.put('/read/:notificationId?', notificationController.markRead); // ID is optional param logic handled in controller? Express might need strict param

// Device token management for push notifications
router.post('/device-token', notificationController.registerDeviceToken);
router.delete('/device-token/:token', notificationController.unregisterDeviceToken);

module.exports = router;
