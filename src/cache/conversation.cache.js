const { redisClient } = require('../config/redis');

class ConversationCache {
    // Cache whole conversation helper, though usually we only cache recent messages
    // or unread counts
    
    async get(id) {
        const data = await redisClient.get(`conversation:${id}`);
        return data ? JSON.parse(data) : null;
    }
    
    async set(id, data, ttl=600) {
        await redisClient.set(`conversation:${id}`, JSON.stringify(data), { EX: ttl });
    }
}
module.exports = new ConversationCache();
