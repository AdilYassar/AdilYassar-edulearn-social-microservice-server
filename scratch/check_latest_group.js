const mongoose = require('mongoose');
require('dotenv').config();

async function checkRecentGroups() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Group = require('../src/models/Group');
        const Conversation = require('../src/models/Conversation');

        const latestGroup = await Group.findOne().sort({ createdAt: -1 });
        if (latestGroup) {
            console.log('LATEST GROUP:', JSON.stringify(latestGroup, null, 2));
            
            const linkedConversation = await Conversation.findById(latestGroup.conversationId);
            console.log('LINKED CONVERSATION:', JSON.stringify(linkedConversation, null, 2));
        } else {
            console.log('No groups found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkRecentGroups();
