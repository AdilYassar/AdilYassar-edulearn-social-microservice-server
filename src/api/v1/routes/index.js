const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'social-microservice' });
});

// Import route modules
const authRoutes = require('./auth.routes');
const friendRoutes = require('./friends.routes');
const chatRoutes = require('./chat.routes');
const feedRoutes = require('./feed.routes');
const notificationRoutes = require('./notification.routes');
const usersRoutes = require('./users.routes');
const mediaRoutes = require('./media.routes');
const groupsRoutes = require('./groups.routes');
const messageRequestRoutes = require('./message-request.routes');

router.use('/auth', authRoutes);
router.use('/friends', friendRoutes);
router.use('/chat', chatRoutes);
router.use('/feed', feedRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', usersRoutes);
router.use('/media', mediaRoutes);
router.use('/groups', groupsRoutes);
router.use('/message-requests', messageRequestRoutes);

module.exports = router;
