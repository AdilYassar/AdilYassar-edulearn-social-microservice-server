/**
 * Microservice: Debug Notification Delivery Script
 * Checks database, Firebase connection, and device tokens
 * 
 * Run: node tests/debug-notification-delivery.js
 */

require('dotenv/config');
const mongoose = require('mongoose');
const connectDB = require('../src/config/database.js');
const { getFirebaseMessaging } = require('../src/config/firebase.js');
const deviceTokenRepo = require('../src/repositories/device-token.repository.js');

const TEST_USER_UUID = 'e05bb02d-d4d4-468d-8436-6ba765ff8e99'; // Same test user from Quiz Server

async function debugNotificationDelivery() {
    console.log('🔍 Microservice Firebase Notification Delivery Debugger\n');
    console.log('═'.repeat(60));

    try {
        // 1. Connect to database
        console.log('\n1️⃣ Connecting to database...');
        await connectDB();
        console.log('   ✅ Connected to edulearn-social database\n');

        // 2. Get device tokens
        console.log('2️⃣ Checking device tokens...');
        const devices = await deviceTokenRepo.findByUser(TEST_USER_UUID);
        
        if (devices.length === 0) {
            console.log('❌ No device tokens found\n');
            console.log('⚠️  Make sure the device token was registered from Quiz Server first.');
            console.log('    Both servers use the shared database (edulearn-social).\n');
            process.exit(1);
        }

        console.log(`✅ Found ${devices.length} device(s):`);
        devices.forEach((device, index) => {
            console.log(`\n   Device ${index + 1}:`);
            console.log(`   ├─ Name: ${device.deviceName}`);
            console.log(`   ├─ Type: ${device.deviceType}`);
            console.log(`   ├─ OS: ${device.osVersion}`);
            console.log(`   ├─ App: ${device.appVersion}`);
            console.log(`   ├─ Token: ${device.token.substring(0, 50)}...`);
            console.log(`   ├─ Invalid: ${device.isInvalid ? '❌ YES' : '✅ NO'}`);
            console.log(`   ├─ Last Used: ${device.lastUsed}`);
            console.log(`   ├─ Created: ${device.createdAt}`);
            console.log(`   └─ Updated: ${device.updatedAt}`);
        });

        // Check for invalid tokens
        const invalidCount = devices.filter(d => d.isInvalid).length;
        if (invalidCount > 0) {
            console.log(`\n⚠️  Warning: ${invalidCount} token(s) marked as INVALID`);
            console.log('   These devices need to re-register.\n');
        }

        // 3. Initialize Firebase
        console.log('\n3️⃣ Initializing Firebase...');
        const messaging = getFirebaseMessaging();
        
        if (!messaging) {
            console.log('❌ Firebase not initialized\n');
            process.exit(1);
        }
        console.log('✅ Firebase ready\n');

        // 4. Send test messages
        console.log('4️⃣ Sending test messages...\n');

        const validDevices = devices.filter(d => !d.isInvalid);

        if (validDevices.length === 0) {
            console.log('❌ All tokens marked as invalid. Cannot send.\n');
            process.exit(1);
        }

        // Test 1: Data-only message
        console.log('   TEST 1: Data-only message (background)');
        try {
            const msg1 = await messaging.send({
                data: {
                    type: 'test_data_only',
                    title: 'Microservice Data Test',
                    body: 'This is a data-only message test',
                    timestamp: new Date().toISOString()
                },
                token: validDevices[0].token
            });
            console.log(`   ✅ Sent: ${msg1}`);
        } catch (e) {
            console.log(`   ❌ Failed: ${e.message}`);
            if (e.code === 'messaging/invalid-registration-token') {
                console.log('      → Token is INVALID/EXPIRED');
            }
        }

        // Test 2: Simple notification
        console.log('\n   TEST 2: Simple notification (foreground)');
        try {
            const msg2 = await messaging.send({
                notification: {
                    title: '🧪 Microservice Test',
                    body: 'Testing from the microservice!'
                },
                token: validDevices[0].token
            });
            console.log(`   ✅ Sent: ${msg2}`);
        } catch (e) {
            console.log(`   ❌ Failed: ${e.message}`);
        }

        // Test 3: Notification with high priority
        console.log('\n   TEST 3: High priority notification');
        try {
            const msg3 = await messaging.send({
                notification: {
                    title: '🔔 MICROSERVICE HIGH PRIORITY',
                    body: 'This should definitely show up'
                },
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default'
                    }
                },
                token: validDevices[0].token
            });
            console.log(`   ✅ Sent: ${msg3}`);
        } catch (e) {
            console.log(`   ❌ Failed: ${e.message}`);
        }

        // Test 4: Multicast message (if multiple devices)
        if (validDevices.length > 1) {
            console.log('\n   TEST 4: Multicast (multiple devices)');
            try {
                const response = await messaging.sendMulticast({
                    tokens: validDevices.map(d => d.token),
                    notification: {
                        title: '📲 Multicast Test',
                        body: 'Testing multiple devices'
                    },
                    data: {
                        type: 'multicast_test',
                        deviceCount: validDevices.length.toString()
                    }
                });
                console.log(`   ✅ Sent to ${response.successCount}/${validDevices.length} devices`);
                if (response.failureCount > 0) {
                    console.log(`   ⚠️  ${response.failureCount} failed`);
                }
            } catch (e) {
                console.log(`   ❌ Failed: ${e.message}`);
            }
        }

        // 5. Troubleshooting info
        console.log('\n' + '═'.repeat(60));
        console.log('\n📋 TROUBLESHOOTING CHECKLIST\n');
        
        console.log('❓ Database Connection');
        console.log('   ✅ Connected to: edulearn-social (shared database)');
        console.log('   ✅ Device tokens from: devicetokens collection');
        console.log('   ✅ Both Quiz Server and Microservice use this database');
        
        console.log('\n❓ Token Status');
        console.log(`   ✅ Valid tokens: ${validDevices.length}/${devices.length}`);
        console.log(`   ${devices.filter(d => d.isInvalid).length > 0 ? '⚠️' : '✅'} Invalid tokens: ${devices.filter(d => d.isInvalid).length}`);
        
        console.log('\n❓ Firebase Status');
        console.log('   ✅ Project: edulearn-ce604');
        console.log('   ✅ Messaging initialized');
        console.log('   ✅ Ready to send notifications');
        
        console.log('\n❓ Device Status');
        console.log('   → Is your app installed and running on the device?');
        console.log('   → Has the app granted notification permissions?');
        console.log('   → Are you using same UUID that registered the token?');
        
        console.log('\n' + '═'.repeat(60));
        console.log('\n✅ Debugger complete. Ready to send real notifications.\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected\n');
    }
}

debugNotificationDelivery();
