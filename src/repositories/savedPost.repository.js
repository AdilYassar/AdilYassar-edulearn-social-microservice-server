const SavedPost = require('../models/SavedPost');

class SavedPostRepository {
    async save(userUUID, postId) {
        // Use upsert-like behavior to prevent errors on duplicate saves
        return await SavedPost.findOneAndUpdate(
            { userUUID, postId },
            { userUUID, postId },
            { upsert: true, new: true }
        );
    }

    async remove(userUUID, postId) {
        return await SavedPost.findOneAndDelete({ userUUID, postId });
    }

    async findByUser(userUUID, skip = 0, limit = 20) {
        return await SavedPost.find({ userUUID })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'postId',
                populate: { path: 'author' }
            });
    }

    async isSaved(userUUID, postId) {
        const count = await SavedPost.countDocuments({ userUUID, postId });
        return count > 0;
    }
}

module.exports = new SavedPostRepository();
