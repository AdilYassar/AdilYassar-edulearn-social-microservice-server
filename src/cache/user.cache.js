const cacheService = require('./index');

const USER_PREFIX = 'user:profile:';

class UserCache {
    async getUser(uuid) {
        return await cacheService.get(`${USER_PREFIX}${uuid}`);
    }

    async setUser(uuid, data) {
        // Cache for 5 mins
        await cacheService.set(`${USER_PREFIX}${uuid}`, data, 300);
    }

    async invalidateUser(uuid) {
        await cacheService.del(`${USER_PREFIX}${uuid}`);
    }
}

module.exports = new UserCache();
