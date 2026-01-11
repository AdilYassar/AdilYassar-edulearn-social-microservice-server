const friendService = require('../../../services/friends.service');

exports.sendRequest = async (req, res) => {
  try {
    const { recipientUUID, message } = req.body;
    const friendship = await friendService.sendRequest(req.user.quizServerUUID, recipientUUID, message);
    res.status(201).json({ status: 'success', data: friendship });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const { requesterUUID } = req.body; // Or from params
    const friendship = await friendService.acceptRequest(req.user.quizServerUUID, requesterUUID);
    res.status(200).json({ status: 'success', data: friendship });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { requesterUUID } = req.body;
    const friendship = await friendService.rejectRequest(req.user.quizServerUUID, requesterUUID);
    res.status(200).json({ status: 'success', data: friendship });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const friends = await friendService.getFriends(req.user.quizServerUUID);
    res.status(200).json({ status: 'success', data: friends });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const requests = await friendService.getRequests(req.user.quizServerUUID);
    res.status(200).json({ status: 'success', data: requests });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const { uuid } = req.params;
    const result = await friendService.blockUser(req.user.quizServerUUID, uuid);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.unblockUser = async (req, res) => {
  try {
    const { uuid } = req.params;
    const result = await friendService.unblockUser(req.user.quizServerUUID, uuid);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    res.status(400).json({ status: 'error', message: error.message });
  }
};

exports.getSuggestions = async (req, res) => {
  try {
    const suggestions = await friendService.getSuggestions(req.user.quizServerUUID);
    res.status(200).json({ status: 'success', data: suggestions });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
