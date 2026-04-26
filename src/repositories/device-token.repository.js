const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema({
    userUUID: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    
    // Device info
    deviceType: { type: String, enum: ['ios', 'android', 'web'], default: 'web' },
    deviceName: { type: String },
    osVersion: { type: String },
    appVersion: { type: String },
    email: { type: String },
    
    // Status
    isInvalid: { type: Boolean, default: false },
    lastUsed: { type: Date, default: Date.now },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now, index: { expires: 7776000 } } // Auto-delete after 90 days
});

const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema);

class DeviceTokenRepository {
    async create(data) {
        const token = new DeviceToken(data);
        return await token.save();
    }

    async findByToken(token) {
        return await DeviceToken.findOne({ token });
    }

    async findByUser(userUUID) {
        return await DeviceToken.find({ userUUID, isInvalid: false });
    }

    async findByUsers(userUUIDs) {
        return await DeviceToken.find({ 
            userUUID: { $in: userUUIDs }, 
            isInvalid: false 
        });
    }

    async update(token, data) {
        return await DeviceToken.findOneAndUpdate(
            { token },
            { ...data, updatedAt: new Date() },
            { new: true }
        );
    }

    async markInvalid(tokens) {
        return await DeviceToken.updateMany(
            { token: { $in: tokens } },
            { isInvalid: true, updatedAt: new Date() }
        );
    }

    async delete(token) {
        return await DeviceToken.deleteOne({ token });
    }

    async deleteByUser(userUUID) {
        return await DeviceToken.deleteMany({ userUUID });
    }

    async cleanup() {
        // Remove old invalid tokens
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return await DeviceToken.deleteMany({
            isInvalid: true,
            updatedAt: { $lt: thirtyDaysAgo }
        });
    }

    async findAllValidTokens() {
        return await DeviceToken.find({ isInvalid: false });
    }
}

module.exports = new DeviceTokenRepository();
