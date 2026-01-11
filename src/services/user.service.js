const User = require('../models/User');

const userCache = require('../cache/user.cache');

class UserService {
    async getUserProfile(uuid) {
        const cached = await userCache.getUser(uuid);
        if (cached) return cached;

        const user = await User.findOne({ quizServerUUID: uuid });
        if (user) {
            await userCache.setUser(uuid, user);
        }
        return user;
    }

    async updateProfile(uuid, data) {
        // Prevent updating critical fields
        delete data.quizServerUUID;
        delete data.userType;
        
        const updated = await User.findOneAndUpdate(
            { quizServerUUID: uuid },
            { $set: data },
            { new: true }
        );

        if (updated) {
            await userCache.invalidateUser(uuid);
            // Or set new data: await userCache.setUser(uuid, updated);
        }
        return updated;
    }

    async searchUsers(query, currentUUID) {
        if (!query) return [];
        
        // Simple text search on name, exclude self
        return await User.find({
            $text: { $search: query },
            quizServerUUID: { $ne: currentUUID },
            "socialSettings.privacy.profileVisibility": { $ne: 'private' } // Respect privacy
        })
        .select('quizServerUUID name avatar bio')
        .limit(20);
    }
}

module.exports = new UserService();
