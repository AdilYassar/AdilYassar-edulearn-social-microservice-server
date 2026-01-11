const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const schemas = require('../validators/message.validator');
const validate = require('../middlewares/validation.middleware');

router.use(authenticate);

// Conversations
router.get('/conversations', chatController.getConversations);
router.post('/conversations', validate(schemas.createConversation), chatController.createConversation);

// Messages
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', validate(schemas.sendMessage), chatController.sendMessage);

router.put('/conversations/:conversationId/mute', chatController.muteConversation);
router.put('/conversations/:conversationId/read', chatController.markAsRead);
router.post('/messages/:id/react', chatController.addReaction);

module.exports = router;
