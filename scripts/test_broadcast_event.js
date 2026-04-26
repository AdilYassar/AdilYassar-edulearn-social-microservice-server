const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const firebaseNotificationService = require('../src/services/firebase-notification.service');
const { initFirebase } = require('../src/config/firebase');

async function testBroadcast() {
    try {
        console.log('🚀 Starting Broadcast Event Test...');
        
        // Initialize Firebase
        initFirebase();
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const eventData = {
            type: 'SOCIAL_EVENT',
            subType: 'MESSAGE_RECEIVED',
            payload: JSON.stringify({
                conversationId: 'test-convo-123',
                message: {
                    _id: 'test-msg-' + Date.now(),
                    content: { text: 'Hello! This is a real-time event test.' },
                    senderUUID: 'system',
                    timestamp: new Date().toISOString()
                }
            }),
            sentAt: new Date().toISOString()
        };

        console.log('📡 Sending broadcast silent event...');
        const result = await firebaseNotificationService.broadcast('SOCIAL_EVENT', {}, eventData);
        
        console.log('✅ Broadcast result:', result);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

testBroadcast();
