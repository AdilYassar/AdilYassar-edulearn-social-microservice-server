const Like = require('../models/Like');

class LikeRepository {
    async find(userUUID, targetType, targetId) {
        return await Like.findOne({ userUUID, targetType, targetId });
    }

    async create(data) {
        return await Like.create(data);
    }

    async delete(id) {
        return await Like.findByIdAndDelete(id);
    }

    async findMany(userUUID, targetType, targetIds) {
        return await Like.find({
            userUUID,
            targetType,
            targetId: { $in: targetIds }
        });
    }
}

module.exports = new LikeRepository();
