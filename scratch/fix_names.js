const mongoose = require('mongoose');
require('dotenv').config();

async function fixUserNames() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected');

        const usersToFix = [
            { uuid: '41e0da14-c55f-4b52-8fc1-c512418eff03', name: 'Yashra Yassar' },
            { uuid: '1693476f-63a1-4400-95bb-5d4565227686', name: 'Adil' }
        ];

        for (let u of usersToFix) {
            const res = await mongoose.connection.db.collection('users').updateOne(
                { quizServerUUID: u.uuid },
                { $set: { name: u.name } }
            );
            console.log(`Updated user ${u.uuid} with name: ${u.name} (Matched: ${res.matchedCount})`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixUserNames();
