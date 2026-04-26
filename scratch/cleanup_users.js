const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupUsers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to:', mongoose.connection.db.databaseName);

        const keptUUIDs = [
            '41e0da14-c55f-4b52-8fc1-c512418eff03',
            '1693476f-63a1-4400-95bb-5d4565227686'
        ];

        console.log('Cleaning up users collection...');
        
        // Delete all users whose quizServerUUID is NOT in the kept list
        const result = await mongoose.connection.db.collection('users').deleteMany({
            quizServerUUID: { $nin: keptUUIDs }
        });

        console.log(`🗑️ Successfully deleted ${result.deletedCount} users.`);
        console.log(`✅ Kept users: ${keptUUIDs.join(', ')}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning up users:', error);
        process.exit(1);
    }
}

cleanupUsers();
