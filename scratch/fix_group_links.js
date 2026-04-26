const mongoose = require('mongoose');
require('dotenv').config();

async function fixGroupLinks() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected');

        const Group = require('../src/models/Group');
        const Conversation = require('../src/models/Conversation');

        const groups = await Group.find({});
        console.log(`Found ${groups.length} groups to check.`);

        for (let group of groups) {
            if (group.conversationId) {
                const res = await Conversation.updateOne(
                    { _id: group.conversationId },
                    { $set: { groupId: group._id } }
                );
                console.log(`Linked Group "${group.name}" to Conversation ${group.conversationId} (Modified: ${res.modifiedCount})`);
            }
        }

        console.log('✅ All groups processed.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixGroupLinks();
