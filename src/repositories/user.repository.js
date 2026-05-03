const User = require('../models/User');

class UserRepository {
    async findByUUID(uuid) {
        return await User.findOne({ quizServerUUID: uuid });
    }

    async create(data) {
        return await User.create(data);
    }

    async update(uuid, data) {
        return await User.findOneAndUpdate({ quizServerUUID: uuid }, data, { new: true });
    }

    async findMany(uuids) {
        return await User.find({ quizServerUUID: { $in: uuids } });
    }

    async findSuggestions(excludeUUIDs, limit = 5) {
        return await User.find({
            quizServerUUID: { $nin: excludeUUIDs },
            userType: { $ne: 'admin' } // Assuming suggesting students
        })
        .limit(limit)
        .select('quizServerUUID name avatar bio');
    }

    async findAllUUIDs() {
        const users = await User.find({ isActive: true }).select('quizServerUUID');
        return users.map(u => u.quizServerUUID);
    }
    async upsertProfile(quizData) {
        const {
            uuid, name, photo, email, phone, age, bio, role,
            learningStreak, totalQuizzesTaken, averageScore,
            totalChaptersCompleted, enrollmentCount, lastLearningActivity
        } = quizData;

        const updateData = {
            name,
            avatar: photo,
            email,
            phone,
            age,
            bio,
            userType: role?.toLowerCase() || 'student',
            learningStats: {
                streak: learningStreak || 0,
                totalQuizzes: totalQuizzesTaken || 0,
                averageScore: averageScore || 0,
                totalChapters: totalChaptersCompleted || 0,
                enrollmentCount: enrollmentCount || 0,
                lastActivity: lastLearningActivity
            },
            lastSyncedAt: new Date()
        };

        return await User.findOneAndUpdate(
            { quizServerUUID: uuid },
            { $set: updateData },
            { upsert: true, new: true }
        );
    }
}
module.exports = new UserRepository();
