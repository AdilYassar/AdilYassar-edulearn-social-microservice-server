# Firebase Notifications Setup - Implementation Guide

## Environment Variables Setup

### Both Servers Need:

```env
# Firebase Configuration (SAME for both servers)
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project","private_key_id":"xxx","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...","client_email":"firebase-adminsdk@your-project.iam.gserviceaccount.com","client_id":"111111","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/.iam.gserviceaccount.com"}'
```

### Microservice Additional:

```env
# Internal communication token
MICROSERVICE_INTERNAL_TOKEN=your-secret-internal-token-change-this
```

### Quiz Server Additional:

```env
# Reference to Microservice
MICROSERVICE_URL=http://localhost:3001  # or https://your-microservice-url
MICROSERVICE_INTERNAL_TOKEN=your-secret-internal-token-change-this  # MUST MATCH microservice
```

## Installation

### Add Firebase Admin SDK to both servers:

```bash
npm install firebase-admin
```

## Step-by-Step Implementation

### 1. Microservice Server Setup

#### Copy These Files:
- `src/config/firebase.js` - Firebase initialization
- `src/services/firebase-notification.service.js` - Core notification service
- `src/repositories/device-token.repository.js` - Device token storage
- Update `src/repositories/notification.repository.js` - Ensure it supports storing notifications
- Update `src/api/v1/controllers/notification.controller.js` - Add device token endpoints
- Update `src/api/v1/routes/notification.routes.js` - Add device token routes
- Create `src/api/v1/routes/internal.routes.js` - Internal API for Quiz Server
- Update `src/api/v1/routes/index.js` - Register internal routes

#### Initialize Firebase on Startup:

**In `src/server.js` or `src/app.js`:**

```javascript
// Add this near the top
const { initFirebase } = require('./config/firebase');

// Initialize Firebase when app starts
initFirebase();
```

#### Add to `.env`:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
MICROSERVICE_INTERNAL_TOKEN=your-secret-internal-token-change-this
```

### 2. Quiz Server Setup

#### Copy These Files:
- Copy `src/config/firebase.js` from microservice
- Create similar device token model and repository
- Create notification service (use `QUIZ_SERVER_FIREBASE_NOTIFICATION.js` as template)
- Add notification endpoints/controllers

#### Example Controller for Auth Notifications:

**In `quiz-server/src/api/v1/controllers/auth.controller.js`:**

```javascript
const firebaseNotificationService = require('../../../services/firebase-notification.service');

exports.login = async (req, res) => {
    try {
        // ... existing login logic ...
        const user = await User.findById(userId);
        
        // Send login notification to all devices
        await firebaseNotificationService.sendAuthNotification(
            user.quizServerUUID,
            {
                deviceName: req.body.deviceName || 'Web Browser',
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        );
        
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

### 3. Frontend Implementation

#### Register Device Token on App Launch:

**For React/Web:**

```javascript
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Initialize Firebase
const firebaseApp = initializeApp(FIREBASE_CONFIG);
const messaging = getMessaging(firebaseApp);

// Register token
async function registerDeviceToken() {
    try {
        const token = await getToken(messaging, {
            vapidKey: 'YOUR_VAPID_PUBLIC_KEY'
        });
        
        // Send to backend
        const response = await fetch('/api/v1/notifications/device-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                token,
                deviceType: 'web',
                deviceName: navigator.userAgent,
                osVersion: navigator.platform
            })
        });
        
        console.log('Device token registered:', token);
    } catch (error) {
        console.error('Failed to register device token:', error);
    }
}

// Listen for foreground messages
onMessage(messaging, (payload) => {
    console.log('Message received:', payload);
    // Show notification or update UI
    showNotification(payload.notification);
});

// Call on app initialization
registerDeviceToken();
```

**For React Native/Expo:**

```javascript
import * as Notifications from 'expo-notifications';

async function registerDeviceToken(authToken) {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        
        // Send to backend
        const response = await fetch('http://your-api/v1/notifications/device-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                token,
                deviceType: 'ios', // or 'android'
                deviceName: Device.modelName,
                osVersion: Device.osVersion,
                appVersion: '1.0.0'
            })
        });
    }
}
```

## Usage Examples

### Sending Notifications from Microservice

**When friend request is created:**

```javascript
// src/services/friends.service.js
const firebaseNotificationService = require('./firebase-notification.service');

async function sendFriendRequest(senderUUID, receiverUUID) {
    // ... create friendship request ...
    
    const sender = await User.findOne({ quizServerUUID: senderUUID });
    
    await firebaseNotificationService.sendToUser(
        receiverUUID,
        'friend_request',
        {
            title: `Friend Request from ${sender.name}`,
            body: `${sender.name} wants to be your friend`,
            imageUrl: sender.profileImage
        },
        {
            targetType: 'friendship',
            targetId: friendshipRequest._id,
            actorUUID: senderUUID,
            senderName: sender.name
        }
    );
}
```

**When message is received:**

```javascript
// src/socket/handlers/chat.handler.js
const firebaseNotificationService = require('../../services/firebase-notification.service');

async handleNewMessage(socket, data) {
    const message = await messageRepository.create(data);
    const sender = await User.findOne({ _id: data.senderId });
    
    // Send to microservice to store
    await firebaseNotificationService.sendToUser(
        data.recipientUUID,
        'message_received',
        {
            title: `Message from ${sender.name}`,
            body: data.content.substring(0, 100),
            imageUrl: sender.profileImage
        },
        {
            targetType: 'conversation',
            targetId: data.conversationId,
            actorUUID: sender.quizServerUUID,
            preview: data.content
        }
    );
}
```

### Sending Notifications from Quiz Server

**When user logs in:**

```javascript
// quiz-server/src/services/auth.service.js
const firebaseNotificationService = require('./firebase-notification.service');

async function login(email, password, deviceInfo) {
    const user = await User.findOne({ email });
    
    if (user) {
        // Send security alert
        await firebaseNotificationService.sendAuthNotification(
            user.quizServerUUID,
            {
                deviceName: deviceInfo.deviceName,
                location: deviceInfo.location,
                timestamp: new Date()
            }
        );
    }
    
    return user;
}
```

**When quiz is assigned:**

```javascript
// quiz-server/src/services/quiz.service.js
const firebaseNotificationService = require('./firebase-notification.service');

async function assignQuizToStudents(quizId, studentUUIDs) {
    const quiz = await Quiz.findById(quizId);
    
    await firebaseNotificationService.sendToUsers(
        studentUUIDs,
        'quiz_assigned',
        {
            title: `Quiz: ${quiz.title}`,
            body: `You have been assigned a new quiz: ${quiz.title}`,
            imageUrl: quiz.imageUrl
        },
        {
            quizId: quiz._id,
            deadline: quiz.dueDate,
            totalQuestions: quiz.questions.length
        }
    );
}
```

## Notification Types

### From Microservice:
- `friend_request` - Friend request sent
- `friend_accepted` - Friend request accepted
- `message_received` - New message
- `group_invite` - Group invitation
- `post_liked` - Post was liked
- `post_commented` - Post was commented on
- `mention` - User was mentioned
- `feed_update` - Feed update

### From Quiz Server:
- `auth_login` - New login detected
- `quiz_assigned` - Quiz assigned
- `quiz_completed` - Quiz completion
- `achievement_unlocked` - Achievement earned
- `grade_released` - Grades released
- `homework_reminder` - Homework reminder

## Testing

### Test Device Token Registration:

```bash
curl -X POST http://localhost:3001/api/v1/notifications/device-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "token": "test-firebase-token",
    "deviceType": "web",
    "deviceName": "Chrome Browser"
  }'
```

### Test Internal API:

```bash
curl -X GET http://localhost:3001/api/v1/internal/device-tokens/user-uuid-123 \
  -H "X-Internal-Token: your-secret-internal-token-change-this"
```

## Troubleshooting

### 1. Firebase Not Initialized
**Error:** "Firebase messaging not initialized"
**Solution:** 
- Check `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable
- Ensure JSON is valid
- Check Firebase project credentials

### 2. Invalid Tokens
**Issue:** Notifications failing with "invalid-registration-token"
**Solution:**
- These tokens are automatically marked as invalid
- They'll be removed on next cleanup
- Check token format from Firebase

### 3. Cross-Server Token Sync Issues
**Issue:** Tokens not syncing between servers
**Solution:**
- Verify `MICROSERVICE_INTERNAL_TOKEN` matches on both
- Check network connectivity between servers
- Review logs for sync errors

### 4. Missing Device Tokens
**Issue:** No tokens returned for user
**Solution:**
- Ensure frontend calls `/api/v1/notifications/device-token` to register
- Check browser console for registration errors
- Verify browser permissions for notifications

## Production Checklist

- [ ] Set strong `MICROSERVICE_INTERNAL_TOKEN` (32+ characters)
- [ ] Use Firebase service account credentials securely
- [ ] Enable HTTPS on both servers
- [ ] Set up monitoring for notification delivery
- [ ] Configure Firebase with appropriate rate limits
- [ ] Test cross-server notification delivery
- [ ] Set up log aggregation for notification events
- [ ] Schedule periodic cleanup of invalid tokens
- [ ] Document your notification types and triggers
