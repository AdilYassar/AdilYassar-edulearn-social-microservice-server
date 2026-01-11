const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', notificationController.getNotifications);
router.put('/read/:notificationId?', notificationController.markRead); // ID is optional param logic handled in controller? Express might need strict param

module.exports = router;
