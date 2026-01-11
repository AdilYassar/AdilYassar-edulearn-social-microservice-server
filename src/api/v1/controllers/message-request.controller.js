const messageRequestService = require('../../../services/message-request.service');

exports.getRequests = async (req, res) => {
    try {
        const requests = await messageRequestService.getRequests(req.user.quizServerUUID);
        res.status(200).json({ status: 'success', data: requests });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.createRequest = async (req, res) => {
    try {
        const { recipientUUID, message, type } = req.body;
        const request = await messageRequestService.createRequest(req.user.quizServerUUID, recipientUUID, message, type);
        res.status(201).json({ status: 'success', data: request });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.acceptRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await messageRequestService.acceptRequest(req.user.quizServerUUID, id);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await messageRequestService.rejectRequest(req.user.quizServerUUID, id);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};
