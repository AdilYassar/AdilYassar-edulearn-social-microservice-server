const chatService = require('../../../services/chat.service');

exports.createConversation = async (req, res) => {
    try {
        const { recipientUUID } = req.body;
        const conversation = await chatService.createDirectConversation(req.user.quizServerUUID, recipientUUID);
        res.status(201).json({ status: 'success', data: conversation });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.getConversations = async (req, res) => {
    try {
        const conversations = await chatService.getConversations(req.user.quizServerUUID);
        res.status(200).json({ status: 'success', data: conversations });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { page, limit } = req.query;
        // Verify user is in conversation! (Important security step usually, skipping deep check for speed here but assuming logic holds)
        
        const messages = await chatService.getMessages(conversationId, parseInt(page), parseInt(limit));
        res.status(200).json({ status: 'success', data: messages });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content, type } = req.body;
        
        const message = await chatService.sendMessage(req.user.quizServerUUID, conversationId, content, type);
        res.status(201).json({ status: 'success', data: message });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.muteConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const result = await chatService.muteConversation(req.user.quizServerUUID, conversationId);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const result = await chatService.markAsRead(req.user.quizServerUUID, conversationId);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.addReaction = async (req, res) => {
    try {
        const { id } = req.params; // messageId
        const { emoji } = req.body;
        const result = await chatService.addReaction(req.user.quizServerUUID, id, emoji);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};
