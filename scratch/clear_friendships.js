const mongoose = require('mongoose');
require('dotenv').config();

async function deleteAllFriendships() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to:', mongoose.connection.db.databaseName);

        const result = await mongoose.connection.db.collection('friendships').deleteMany({});
        
        console.log(`🗑️ Successfully deleted ${result.deletedCount} documents from 'friendships' collection.`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error deleting friendships:', error);
        process.exit(1);
    }
}

deleteAllFriendships();
