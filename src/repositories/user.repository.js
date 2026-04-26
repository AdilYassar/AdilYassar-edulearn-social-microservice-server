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
}
module.exports = new UserRepository();
