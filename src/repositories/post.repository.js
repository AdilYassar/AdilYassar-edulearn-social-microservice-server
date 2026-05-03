const Post = require('../models/Post');

class PostRepository {
    async findFeed(query, skip, limit) {
        return await Post.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
    }
    
    async create(data) {
        return await Post.create(data);
    }
    
    async findById(id) {
        return await Post.findById(id);
    }
    
    async update(id, updates) {
        return await Post.findByIdAndUpdate(id, updates, { new: true });
    }

    async updateStats(id, statsChange) {
        return await Post.findByIdAndUpdate(id, { $inc: statsChange });
    }

    async findOwned(id, authorUUID) {
        return await Post.findOne({ _id: id, authorUUID });
    }

    async findOne(query) {
        return await Post.findOne(query);
    }

    async delete(id) {
        // Soft delete usually done via update, but if hard delete needed:
        return await Post.findByIdAndDelete(id);
    }
}
module.exports = new PostRepository();
