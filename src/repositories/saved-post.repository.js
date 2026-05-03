const SavedPost = require('../models/SavedPost');

class SavedPostRepository {
    async find(userUUID, postId) {
        return await SavedPost.findOne({ userUUID, postId });
    }

    async create(data) {
        return await SavedPost.create(data);
    }

    async delete(id) {
        return await SavedPost.findByIdAndDelete(id);
    }

    async findByUser(userUUID, skip = 0, limit = 20) {
        return await SavedPost.find({ userUUID })
            .populate('postId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
    }

    async countByUser(userUUID) {
        return await SavedPost.countDocuments({ userUUID });
    }
}

module.exports = new SavedPostRepository();
