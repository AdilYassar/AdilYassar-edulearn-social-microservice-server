const { redisClient } = require('../config/redis');
const config = require('../config');

class CacheService {
    constructor() {
        this.client = redisClient;
        this.ttl = config.redis.ttl || 300;
    }

    async get(key) {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set(key, value, ttl = this.ttl) {
        await this.client.set(key, JSON.stringify(value), {
            EX: ttl
        });
    }

    async del(key) {
        await this.client.del(key);
    }
    
    // Pattern based delete (use scan in prod, keys is blocking)
    async clearPattern(pattern) {
        // Implementation depend on needs, usually avoided in high load
    }
}

module.exports = new CacheService();
