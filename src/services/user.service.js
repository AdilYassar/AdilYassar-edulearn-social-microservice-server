const User = require('../models/User');
const friendshipRepository = require('../repositories/friendship.repository');

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

    async discoverUsers(currentUUID, page = 1, limit = 20) {
        try {
            // 1. Get all friend UUIDs (accepted friendships only)
            const friendships = await friendshipRepository.findFriends(currentUUID);
            const friendUUIDs = friendships.map(f => 
                f.requesterUUID === currentUUID ? f.recipientUUID : f.requesterUUID
            );

            // 2. Get all pending request UUIDs (both sent and received)
            const Friendship = require('../models/Friendship');
            const pendingRequests = await Friendship.find({
                $or: [
                    { requesterUUID: currentUUID, status: 'pending' },
                    { recipientUUID: currentUUID, status: 'pending' }
                ]
            });

            const pendingUUIDs = pendingRequests.flatMap(f => [f.requesterUUID, f.recipientUUID]);

            // 3. Combine all excluded UUIDs (self + friends + pending requests)
            const excludeUUIDs = [
                currentUUID,
                ...friendUUIDs,
                ...pendingUUIDs
            ];

            // 4. Remove duplicates
            const uniqueExcludeUUIDs = [...new Set(excludeUUIDs)];

            // 5. Calculate pagination
            const skip = (page - 1) * limit;

            // 6. Fetch users with pagination
            const users = await User.find({
                quizServerUUID: { $nin: uniqueExcludeUUIDs },
                "socialSettings.privacy.profileVisibility": { $ne: 'private' }
            })
            .select('quizServerUUID name avatar bio isOnline')
            .skip(skip)
            .limit(limit)
            .lean();

            // 7. Get total count for pagination metadata
            const total = await User.countDocuments({
                quizServerUUID: { $nin: uniqueExcludeUUIDs },
                "socialSettings.privacy.profileVisibility": { $ne: 'private' }
            });

            return {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    hasMore: skip + limit < total
                }
            };
        } catch (error) {
            throw new Error(`Failed to discover users: ${error.message}`);
        }
    }
}

module.exports = new UserService();
