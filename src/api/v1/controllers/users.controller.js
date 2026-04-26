const userService = require('../../../services/user.service');

exports.getMe = async (req, res) => {
    try {
        res.status(200).json({ status: 'success', data: req.user });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getUser = async (req, res) => {
    try {
        const { uuid } = req.params;
        const user = await userService.getUserProfile(uuid);
        if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
        
        // Privacy check could go here
        
        res.status(200).json({ status: 'success', data: user });
    } catch (error) {
         res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.updateMe = async (req, res) => {
    try {
        const updated = await userService.updateProfile(req.user.quizServerUUID, req.body);
        res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.search = async (req, res) => {
    try {
        const { q } = req.query;
        const results = await userService.searchUsers(q, req.user.quizServerUUID);
        res.status(200).json({ status: 'success', data: results });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.discover = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const result = await userService.discoverUsers(
            req.user.quizServerUUID,
            parseInt(page),
            parseInt(limit)
        );
        res.status(200).json({ 
            status: 'success', 
            data: result.users,
            pagination: result.pagination
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
