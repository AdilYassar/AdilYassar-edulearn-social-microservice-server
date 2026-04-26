#!/usr/bin/env node

/**
 * Firebase Connection Test Script
 * Run: node tests/test-firebase.js
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('🧪 Testing Firebase Setup...\n');

try {
    // Test 1: Check environment variable
    console.log('✓ Step 1: Checking environment variables...');
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    console.log(`   Firebase Service Account Path: ${serviceAccountPath}\n`);

    if (!serviceAccountPath) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not set in .env');
    }

    // Test 2: Load Firebase config
    console.log('✓ Step 2: Loading Firebase configuration...');
    const { initFirebase, getFirebaseMessaging } = require('../src/config/firebase');
    
    // Test 3: Initialize Firebase
    console.log('✓ Step 3: Initializing Firebase...');
    const firebaseApp = initFirebase();
    
    if (!firebaseApp) {
        throw new Error('Firebase initialization returned null');
    }
    
    console.log(`   Project ID: edulearn-ce604`);
    console.log(`   Firebase App Name: ${firebaseApp.name}\n`);

    // Test 4: Get messaging service
    console.log('✓ Step 4: Getting Firebase Messaging service...');
    const messaging = getFirebaseMessaging();
    
    if (!messaging) {
        throw new Error('Firebase Messaging is not available');
    }
    
    console.log(`   Messaging Service: Ready ✅\n`);

    // Test 5: Load notification service
    console.log('✓ Step 5: Loading notification service...');
    const firebaseNotificationService = require('../src/services/firebase-notification.service');
    console.log(`   Notification Service: Ready ✅\n`);

    // Test 6: Test Firebase connection
    console.log('✓ Step 6: Testing Firebase connection...');
    firebaseNotificationService.testConnection().then(result => {
        console.log(`   Connection Status: ${result.status}`);
        if (result.projectId) {
            console.log(`   Project ID: ${result.projectId}\n`);
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Firebase Setup is SUCCESSFUL!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        console.log('📚 Next Steps:');
        console.log('1. Start the server: npm run dev');
        console.log('2. Register a device token via API');
        console.log('3. Send your first notification!\n');

        process.exit(0);
    }).catch(error => {
        console.error('   Error:', error.message);
        throw error;
    });

} catch (error) {
    console.error('\n❌ Firebase Setup FAILED!\n');
    console.error('Error:', error.message);
    console.error('\n📝 Troubleshooting:');
    console.error('1. Check firebase-service-account.json exists: src/config/firebase-service-account.json');
    console.error('2. Verify FIREBASE_SERVICE_ACCOUNT_JSON in .env');
    console.error('3. Ensure firebase-admin is installed: npm install firebase-admin');
    console.error('4. Check JSON file is valid and not corrupted\n');

    process.exit(1);
}
