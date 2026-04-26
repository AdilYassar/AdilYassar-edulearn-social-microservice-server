
const mongoose = require('mongoose');
require('dotenv').config();

const deviceTokenSchema = new mongoose.Schema({
    userUUID: String,
    token: String,
    deviceType: String,
    isInvalid: { type: Boolean, default: false }
}, { collection: 'devicetokens' });

const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema);

async function listTokens() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        const tokens = await DeviceToken.find({ isInvalid: false }).limit(5);
        console.log('Available Tokens:', JSON.stringify(tokens, null, 2));
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

listTokens();
