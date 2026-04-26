
const mongoose = require('mongoose');
require('dotenv').config();

// Mock socket.io dependency to avoid "not initialized" error
const socketModule = require('../src/socket');
socketModule.getIO = () => ({
    to: () => ({
        emit: (event, data) => console.log(`[Mock Socket] Emitted ${event}`)
    })
});

const firebaseService = require('../src/services/firebase-notification.service');
const { initFirebase } = require('../src/config/firebase');

async function testNotification() {
    try {
        console.log('--- Firebase Notification Test ---');
        
        // 1. Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // 2. Initialize Firebase
        initFirebase();
        console.log('✅ Firebase Initialized');

        const recipientUUID = '2afef777-c5f5-4349-aece-4393e5168ea9'; // User: adil12@gmail.com
        const content = {
            title: 'Test Notification 🚀',
            body: 'Hello Adil! This is a test from your Social Microservice.',
            imageUrl: 'https://placehold.co/600x400'
        };
        const data = {
            targetType: 'post',
            targetId: '507f1f77bcf86cd799439011', // Valid ObjectId format
            actorUUID: '00000000-0000-0000-0000-000000000000'
        };

        console.log(`Sending notification to user: ${recipientUUID}...`);
        
        const result = await firebaseService.sendToUser(recipientUUID, 'system', content, data);
        
        console.log('--- Result ---');
        console.log(JSON.stringify(result, null, 2));
        console.log('--- Test Complete ---');
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    }
}

testNotification();
