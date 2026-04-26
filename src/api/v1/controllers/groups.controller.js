const groupService = require('../../../services/group.service');

exports.createGroup = async (req, res) => {
    try {
        const { name, description, settings } = req.body;
        const group = await groupService.createGroup(req.user.quizServerUUID, name, description, settings);
        res.status(201).json({ status: 'success', data: group });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.getGroups = async (req, res) => {
    try {
        const groups = await groupService.getGroups(req.user.quizServerUUID);
        res.status(200).json({ status: 'success', data: groups });
    } catch (error) {
         res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const group = await groupService.getGroupDetails(id);
        res.status(200).json({ status: 'success', data: group });
    } catch (error) {
         res.status(404).json({ status: 'error', message: error.message });
    }
};

exports.addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { memberUUID } = req.body;
        const result = await groupService.addMember(req.user.quizServerUUID, id, memberUUID);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
         res.status(400).json({ status: 'error', message: error.message });
    }
};
