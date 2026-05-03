const Comment = require('../models/Comment');

class CommentRepository {
    async create(data) {
        return await Comment.create(data);
    }

    async findByPost(postId, skip, limit, parentId = null) {
        const query = { postId, isDeleted: false };
        if (parentId) {
            query.parentId = parentId;
        } else {
            // If fetching top-level, specifically exclude replies
            query.parentId = { $exists: false };
        }
        
        return await Comment.find(query)
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

    async updateStats(id, updates) {
        return await Comment.findByIdAndUpdate(id, { $inc: updates }, { new: true });
    }
}

module.exports = new CommentRepository();
