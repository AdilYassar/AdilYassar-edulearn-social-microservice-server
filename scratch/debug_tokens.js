const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const deviceTokenSchema = new mongoose.Schema({
    userUUID: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    isInvalid: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now }
});

const DeviceToken = mongoose.models.DeviceToken || mongoose.model('DeviceToken', deviceTokenSchema);

async function debugQuery() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected');
        console.log(`Using Database: ${mongoose.connection.db.databaseName}`);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections in this DB:');
        collections.forEach(c => console.log(`- ${c.name}`));

        const userUUID = '41e0da14-c55f-4b52-8fc1-c512418eff03';
        console.log(`Querying for userUUID: "${userUUID}"`);

        const allTokens = await DeviceToken.find({});
        console.log(`Total tokens in DB: ${allTokens.length}`);
        
        allTokens.forEach(t => {
            console.log(`- Token: ${t.token.substring(0, 10)}..., User: "${t.userUUID}", isInvalid: ${t.isInvalid}`);
            if (t.userUUID === userUUID) {
                console.log('   MATCH FOUND (JS comparison)');
            }
        });

        const queryResult = await DeviceToken.find({ userUUID, isInvalid: false });
        console.log(`Query result length: ${queryResult.length}`);

        if (queryResult.length > 0) {
            console.log('✅ Found devices via Mongoose query');
        } else {
            console.log('❌ NOT found via Mongoose query');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugQuery();
