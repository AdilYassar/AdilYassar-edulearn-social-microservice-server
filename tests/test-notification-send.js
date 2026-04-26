/**
 * Microservice: Send Actual Firebase Notification to Device in Database
 * This script sends a real notification to the device token stored in the shared MongoDB
 * 
 * Run: node tests/test-notification-send.js
 */

require('dotenv/config');
const mongoose = require('mongoose');
const connectDB = require('../src/config/database.js');
const { initFirebase, getFirebaseMessaging } = require('../src/config/firebase.js');
const deviceTokenRepo = require('../src/repositories/device-token.repository.js');
const Notification = require('../src/models/notification.js');

const TEST_USER_UUID = 'e05bb02d-d4d4-468d-8436-6ba765ff8e99'; // Same test user from Quiz Server

async function sendTestNotification() {
    console.log('🚀 Microservice Firebase Notification Test Script');
    console.log('=' .repeat(50) + '\n');

    try {
        // 1. Connect to database
        console.log('1️⃣ Connecting to database...');
        await connectDB();
        console.log('✅ Connected to edulearn-social (shared database)\n');

        // 2. Initialize Firebase
        console.log('2️⃣ Initializing Firebase...');
        const app = initFirebase();
        console.log(`   Firebase App: ${app ? 'Initialized' : 'Not initialized'}`);
        
        const messaging = getFirebaseMessaging();
        console.log(`   Messaging: ${messaging ? 'Ready' : 'Not ready'}`);
        console.log(`   Has sendMulticast: ${messaging && typeof messaging.sendMulticast === 'function' ? 'Yes' : 'No'}`);
        
        if (!messaging) {
            throw new Error('Firebase messaging not initialized');
        }
        console.log('✅ Firebase initialized\n');

        // 3. Get device tokens for test user
        console.log(`3️⃣ Fetching device tokens for user: ${TEST_USER_UUID}`);
        
        const devices = await deviceTokenRepo.findByUser(TEST_USER_UUID);

        if (devices.length === 0) {
            console.log('❌ No device tokens found for this user');
            console.log('   Make sure the device registered from Quiz Server first.\n');
            return;
        }

        console.log(`✅ Found ${devices.length} device(s):`);
        devices.forEach((device, index) => {
            console.log(`   ${index + 1}. ${device.deviceName} (${device.deviceType})`);
            console.log(`      Token: ${device.token.substring(0, 50)}...`);
            console.log(`      Valid: ${device.isInvalid ? '❌ NO' : '✅ YES'}`);
        });
        console.log('');

        // 5. Send notification via Firebase
        console.log('4️⃣ Sending notification via Firebase Cloud Messaging...');
        
        const validTokens = devices.filter(d => !d.isInvalid).map(d => d.token);
        
        if (validTokens.length === 0) {
            console.log('❌ No valid tokens. All devices marked as invalid.\n');
            return;
        }

        const message = {
            notification: {
                title: '🎉 Test Notification from Microservice',
                body: 'Social features notifications are working!',
            },
            data: {
                type: 'test_notification',
                source: 'microservice',
                userUUID: TEST_USER_UUID,
                timestamp: new Date().toISOString(),
                message: 'This is a test message from the microservice'
            },
            android: {
                priority: 'high',
                notification: {
                    title: '🎉 Test Notification from Microservice',
                    body: 'Social features notifications are working!',
                    sound: 'default'
                }
            },
            apns: {
                headers: {
                    'apns-priority': '10'
                },
                payload: {
                    aps: {
                        alert: {
                            title: '🎉 Test Notification from Microservice',
                            body: 'Social features notifications are working!'
                        },
                        sound: 'default',
                        badge: 1
                    }
                }
            }
        };

        let response;
        try {
            // Use sendMulticast for batch sending
            response = await messaging.sendMulticast({
                tokens: validTokens,
                notification: message.notification,
                data: message.data,
                android: message.android,
                apns: message.apns
            });

            console.log('✅ Firebase request completed\n');
            console.log(`   📊 Results:`);
            console.log(`      ✅ Successful: ${response.successCount}/${validTokens.length}`);
            console.log(`      ❌ Failed: ${response.failureCount}/${validTokens.length}\n`);

            // Log individual responses
            if (response.responses && response.responses.length > 0) {
                console.log('   📋 Per-device responses:');
                for (let index = 0; index < response.responses.length; index++) {
                    const resp = response.responses[index];
                    const device = devices[index];
                    if (resp.success) {
                        console.log(`      ✅ ${device.deviceName}: Message ID: ${resp.messageId || 'N/A'}`);
                    } else {
                        const errorMsg = resp.error?.message || resp.error?.code || 'Unknown error';
                        console.log(`      ❌ ${device.deviceName}: ${errorMsg}`);
                        
                        // If invalid token, mark it
                        if (resp.error && (
                            resp.error.code === 'messaging/invalid-registration-token' ||
                            resp.error.code === 'messaging/registration-token-not-registered'
                        )) {
                            console.log(`         → Marking token as invalid`);
                            await deviceTokenRepo.markInvalid([device.token]);
                        }
                    }
                }
            }

        } catch (err) {
            console.error('   Error calling Firebase:', err.message);
            throw err;
        }

        console.log('');

        // 6. Store notification record
        console.log('5️⃣ Storing notification in Microservice DB...');
        
        // Import models in a way that works with the microservice structure
        const notificationRecord = await Notification.create({
            recipientUUID: TEST_USER_UUID,
            type: 'test_notification',
            title: message.notification.title,
            body: message.notification.body,
            content: {
                title: message.notification.title,
                body: message.notification.body,
                imageUrl: null
            },
            data: message.data,
            source: 'microservice',
            isRead: false,
            isSent: response.successCount > 0,
            sentAt: new Date(),
            firebaseResponse: {
                successCount: response.successCount,
                failureCount: response.failureCount,
                timestamp: new Date().toISOString()
            },
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log(`✅ Notification stored with ID: ${notificationRecord._id}\n`);

        // 7. Summary
        console.log('📊 Test Summary\n');
        console.log('═'.repeat(50));
        console.log(`User UUID: ${TEST_USER_UUID}`);
        console.log(`Devices: ${devices.length} (${validTokens.length} valid)`);
        console.log(`Firebase Success: ${response.successCount}/${validTokens.length}`);
        console.log(`Stored in DB: Yes`);
        console.log(`Database: edulearn-social`);
        console.log('═'.repeat(50));
        
        if (response.successCount > 0) {
            console.log('\n✅ SUCCESS! Check your device for the notification.');
            console.log('   It may take a few seconds to arrive.');
            console.log('   The notification is from the MICROSERVICE.\n');
        } else {
            console.log('\n⚠️  No messages were successfully sent.');
            console.log('   Check the error messages above.');
            console.log('   Possible reasons:');
            console.log('   1. Device token is expired/invalid');
            console.log('   2. App is not installed or running');
            console.log('   3. App doesn\'t have notification permissions\n');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nStack:', error.stack);
    } finally {
        // Close connections
        await mongoose.disconnect();
        console.log('✅ Disconnected from database');
    }
}

// Run the test
console.log('');
sendTestNotification().then(() => {
    console.log('\n✅ Test completed\n');
    process.exit(0);
}).catch(err => {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
});
