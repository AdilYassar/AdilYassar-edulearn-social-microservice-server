const Comment = require('../models/Comment');

class CommentRepository {
    async create(data) {
        return await Comment.create(data);
    }

    async findByPost(postId, skip, limit) {
        return await Comment.find({ postId, isDeleted: false })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .lean();
    }

    async findById(id) {
        return await Comment.findById(id);
    }
    
    // Helper to find by ID and Author (for ownership check)
    async findOwned(id, authorUUID) {
        return await Comment.findOne({ _id: id, authorUUID });
    }

    async update(id, updates) {
        return await Comment.findByIdAndUpdate(id, updates, { new: true });
    }
}

module.exports = new CommentRepository();
