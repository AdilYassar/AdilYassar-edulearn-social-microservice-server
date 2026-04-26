# Quiz Server - Firebase Notifications Implementation Guide

**Complete guide for implementing Firebase notifications on Quiz Server with full syncing to Microservice**

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Database Setup](#database-setup)
3. [File Structure](#file-structure)
4. [Installation & Configuration](#installation--configuration)
5. [Models & Schemas](#models--schemas)
6. [Service Implementation](#service-implementation)
7. [API Endpoints](#api-endpoints)
8. [Notification Triggers](#notification-triggers)
9. [Cross-Server Syncing](#cross-server-syncing)
10. [Complete Examples](#complete-examples)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Project                          │
│                  (edulearn-ce604) - SHARED                  │
└────────────┬──────────────────────────────┬──────────────────┘
             │                              │
    ┌────────▼────────┐          ┌─────────▼─────────┐
    │  QUIZ SERVER    │          │   MICROSERVICE    │
    │                 │          │                   │
    │  Triggers:      │          │  Triggers:        │
    │  • Auth login   │          │  • Friend request │
    │  • Quiz assign  │          │  • Messages       │
    │  • Grades       │          │  • Feed posts     │
    │  • Achievements │          │  • Group invites  │
    │                 │          │                   │
    │  DB: MongoDB    │          │  DB: MongoDB      │
    │  (quiz-db)      │          │  (edulearn-social)│
    │                 │          │                   │
    └─────────┬───────┘          └────────┬──────────┘
              │                           │
              └───────Internal API calls──┘
                  (X-Internal-Token)
```

---

## Database Setup

### Quiz Server MongoDB Collections

```
Database: quiz-server
├── users
│   ├── _id
│   ├── uuid                          (shared with microservice)
│   ├── email
│   ├── password
│   ├── name
│   ├── profileImage
│   └── createdAt
│
├── devicetokens                      (NEW)
│   ├── _id
│   ├── userUUID                      (index)
│   ├── token                         (unique)
│   ├── deviceType                    (ios/android/web)
│   ├── deviceName
│   ├── osVersion
│   ├── appVersion
│   ├── isInvalid
│   ├── lastUsed
│   ├── createdAt
│   └── updatedAt
│
├── notifications                     (NEW - optional, for audit)
│   ├── _id
│   ├── recipientUUID                 (index)
│   ├── type
│   ├── content
│   ├── createdAt
│   └── sync metadata
│
├── quizzes
│   ├── _id
│   ├── title
│   ├── description
│   └── ...
│
├── assignments
│   ├── _id
│   ├── quizId
│   ├── studentUUIDs                  (array)
│   ├── dueDate
│   └── ...
│
├── quizresults
│   ├── _id
│   ├── quizId
│   ├── studentUUID
│   ├── score
│   ├── totalMarks
│   └── ...
│
└── achievements
    ├── _id
    ├── userUUID
    ├── name
    ├── description
    └── ...
```

---

## File Structure

```
quiz-server/
├── src/
│   ├── config/
│   │   ├── firebase.js               (COPY from microservice)
│   │   ├── firebase-service-account.json (NEW - your credentials)
│   │   ├── database.js               (existing)
│   │   └── index.js                  (existing)
│   │
│   ├── models/
│   │   ├── User.js                   (existing)
│   │   ├── Quiz.js                   (existing)
│   │   ├── DeviceToken.js            (NEW)
│   │   └── Notification.js           (NEW - optional)
│   │
│   ├── repositories/
│   │   ├── user.repository.js        (existing)
│   │   ├── device-token.repository.js (NEW)
│   │   └── notification.repository.js (NEW - optional)
│   │
│   ├── services/
│   │   ├── auth.service.js           (existing - UPDATE)
│   │   ├── quiz.service.js           (existing - UPDATE)
│   │   ├── firebase-notification.service.js (NEW)
│   │   └── microservice.service.js   (NEW - for API calls)
│   │
│   ├── api/
│   │   ├── v1/
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.js (UPDATE)
│   │   │   │   ├── quiz.controller.js (UPDATE)
│   │   │   │   └── notification.controller.js (NEW)
│   │   │   │
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.js    (UPDATE)
│   │   │   │   ├── quiz.routes.js    (UPDATE)
│   │   │   │   ├── notification.routes.js (NEW)
│   │   │   │   └── internal.routes.js (NEW)
│   │   │   │
│   │   │   └── middlewares/
│   │   │       └── auth.middleware.js (existing)
│   │
│   ├── server.js                     (UPDATE - initialize Firebase)
│   └── app.js                        (UPDATE - register routes)
│
├── .env                              (UPDATE)
├── .env.example                      (UPDATE)
├── .gitignore                        (UPDATE)
└── package.json                      (UPDATE)
```

---

## Installation & Configuration

### Step 1: Install Dependencies

```bash
cd quiz-server
npm install firebase-admin
```

### Step 2: Create Firebase Service Account File

Get credentials from Firebase Console (same project as microservice):

```bash
mkdir -p src/config
# Create src/config/firebase-service-account.json with your credentials
```

**File: `src/config/firebase-service-account.json`**
```json
{
  "type": "service_account",
  "project_id": "edulearn-ce604",
  "private_key_id": "xxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk@...",
  ...
}
```

### Step 3: Update Environment Variables

**File: `.env`**
```env
# Node
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/quiz-server

# Firebase (SAME as Microservice!)
FIREBASE_SERVICE_ACCOUNT_JSON=./config/firebase-service-account.json
FIREBASE_VAPID_PUBLIC_KEY=your_vapid_key

# Microservice Integration
MICROSERVICE_URL=http://localhost:3001
MICROSERVICE_INTERNAL_TOKEN=edulearn-microservice-secret-internal-token-change-in-prod

# Other existing configs...
```

### Step 4: Update .gitignore

```gitignore
# Firebase credentials
src/config/firebase-service-account.json
```

### Step 5: Update package.json

Make sure you have these dependencies:
```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "axios": "^1.6.5",
    ...
  }
}
```

---

## Models & Schemas

### Model 1: DeviceToken

**File: `src/models/DeviceToken.js`**

```javascript
const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema({
    userUUID: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    
    // Device info
    deviceType: { type: String, enum: ['ios', 'android', 'web'], default: 'web' },
    deviceName: { type: String },
    osVersion: { type: String },
    appVersion: { type: String },
    
    // Status
    isInvalid: { type: Boolean, default: false },
    lastUsed: { type: Date, default: Date.now },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now, index: { expires: 7776000 } } // 90 days TTL
});

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
```

### Model 2: Notification (Optional - for audit)

**File: `src/models/Notification.js`**

```javascript
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientUUID: { type: String, required: true, index: true },
    
    type: {
        type: String,
        enum: [
            'auth_login',
            'quiz_assigned',
            'quiz_completed',
            'achievement_unlocked',
            'grade_released',
            'homework_reminder'
        ],
        required: true
    },
    
    content: {
        title: { type: String },
        body: { type: String },
        imageUrl: { type: String },
        data: { type: mongoose.Schema.Types.Mixed }
    },
    
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    
    isSent: { type: Boolean, default: false },
    sentAt: { type: Date },
    
    source: { type: String, enum: ['quiz-server', 'microservice'], default: 'quiz-server' },
    
    createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ recipientUUID: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
```

---

## Service Implementation

### Service 1: Firebase Notification Service

**File: `src/services/firebase-notification.service.js`**

```javascript
const { getFirebaseMessaging, admin } = require('../config/firebase');
const DeviceToken = require('../models/DeviceToken');
const Notification = require('../models/Notification');
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class FirebaseNotificationService {
    constructor() {
        this.microserviceUrl = config.microservice?.url;
        this.microserviceToken = config.microservice?.internalToken;
    }

    /**
     * Send notification to single user
     */
    async sendToUser(userUUID, type, content, data = {}) {
        try {
            // 1. Send push notification
            await this.pushToUserDevices(userUUID, type, content, data);

            // 2. Store locally (optional, for audit)
            if (Notification) {
                await Notification.create({
                    recipientUUID: userUUID,
                    type,
                    content,
                    source: 'quiz-server',
                    isSent: true,
                    sentAt: new Date()
                });
            }

            // 3. Sync with microservice
            await this.syncWithMicroservice(userUUID, type, content, data);

            return { success: true, userUUID };
        } catch (error) {
            logger.error(`Failed to send notification to ${userUUID}:`, error);
            throw error;
        }
    }

    /**
     * Send to multiple users
     */
    async sendToUsers(userUUIDs, type, content, data = {}) {
        const results = await Promise.allSettled(
            userUUIDs.map(uuid => this.sendToUser(uuid, type, content, data))
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        logger.info(`Sent notifications to ${successful}/${userUUIDs.length} users. Failed: ${failed}`);
        return { successful, failed, results };
    }

    /**
     * Push to Firebase
     */
    async pushToUserDevices(userUUID, type, content, data = {}) {
        try {
            const messaging = getFirebaseMessaging();
            if (!messaging) {
                logger.warn('Firebase messaging not initialized');
                return { success: 0, failed: 0 };
            }

            // Get device tokens from local DB
            const devices = await DeviceToken.find({ userUUID, isInvalid: false });

            if (devices.length === 0) {
                logger.debug(`No devices for user ${userUUID}`);
                return { success: 0, failed: 0 };
            }

            const validTokens = devices.map(d => d.token);

            const message = {
                notification: {
                    title: content.title || 'New Notification',
                    body: content.body || ''
                },
                data: {
                    type,
                    userUUID,
                    sentAt: new Date().toISOString(),
                    ...data
                },
                ...(content.imageUrl && { webpush: { notification: { icon: content.imageUrl } } }),
                android: { priority: 'high' },
                apns: { headers: { 'apns-priority': '10' } }
            };

            const response = await messaging.sendMulticast({
                ...message,
                tokens: validTokens
            });

            // Mark invalid tokens
            response.responses.forEach((resp, index) => {
                if (!resp.success) {
                    const error = resp.error;
                    if (error.code === 'messaging/invalid-registration-token' ||
                        error.code === 'messaging/registration-token-not-registered') {
                        DeviceToken.updateOne(
                            { token: validTokens[index] },
                            { isInvalid: true }
                        ).catch(err => logger.warn('Failed to mark token invalid:', err));
                    }
                }
            });

            logger.debug(`Pushed to ${response.successCount}/${validTokens.length} devices`);
            return { success: response.successCount, failed: response.failureCount };

        } catch (error) {
            logger.error(`Push to Firebase failed:`, error);
            return { success: 0, failed: 1 };
        }
    }

    /**
     * Sync with Microservice API
     */
    async syncWithMicroservice(userUUID, type, content, data) {
        if (!this.microserviceUrl || !this.microserviceToken) return;

        try {
            await axios.post(
                `${this.microserviceUrl}/api/v1/internal/notifications/sync`,
                {
                    userUUID,
                    type,
                    content,
                    data,
                    source: 'quiz-server'
                },
                {
                    headers: {
                        'X-Internal-Token': this.microserviceToken,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                }
            );

            logger.debug(`Synced notification with microservice: ${userUUID}`);
        } catch (error) {
            logger.warn('Failed to sync with microservice:', error.message);
            // Don't fail - microservice is optional
        }
    }

    /**
     * Register device token
     */
    async registerDeviceToken(userUUID, token, deviceInfo = {}) {
        try {
            let device = await DeviceToken.findOne({ token });

            if (device) {
                if (device.userUUID !== userUUID) {
                    await DeviceToken.updateOne(
                        { token },
                        { userUUID, ...deviceInfo, isInvalid: false }
                    );
                }
                device = await DeviceToken.findOne({ token });
            } else {
                device = await DeviceToken.create({
                    userUUID,
                    token,
                    ...deviceInfo,
                    isInvalid: false
                });
            }

            // Sync with microservice
            await this.syncDeviceTokenWithMicroservice(userUUID, token, deviceInfo);

            logger.info(`Device token registered: ${userUUID}`);
            return device;
        } catch (error) {
            logger.error('Failed to register device token:', error);
            throw error;
        }
    }

    /**
     * Sync device token with microservice
     */
    async syncDeviceTokenWithMicroservice(userUUID, token, deviceInfo) {
        if (!this.microserviceUrl || !this.microserviceToken) return;

        try {
            await axios.post(
                `${this.microserviceUrl}/api/v1/internal/device-tokens/sync`,
                { userUUID, token, deviceInfo },
                {
                    headers: {
                        'X-Internal-Token': this.microserviceToken,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000
                }
            );

            logger.debug(`Device token synced with microservice: ${token}`);
        } catch (error) {
            logger.warn('Failed to sync device token with microservice:', error.message);
        }
    }

    /**
     * Unregister device token
     */
    async unregisterDeviceToken(token) {
        try {
            await DeviceToken.deleteOne({ token });
            logger.info(`Device token unregistered: ${token}`);
        } catch (error) {
            logger.error('Failed to unregister device token:', error);
            throw error;
        }
    }

    /**
     * Send auth notification
     */
    async sendAuthNotification(userUUID, deviceInfo) {
        const content = {
            title: 'New Login Detected',
            body: `Login from ${deviceInfo.deviceName || 'a new device'}`,
            imageUrl: null
        };

        const data = {
            type: 'auth_login',
            deviceName: deviceInfo.deviceName,
            timestamp: new Date().toISOString()
        };

        return this.sendToUser(userUUID, 'auth_login', content, data);
    }

    /**
     * Send quiz assigned notification
     */
    async sendQuizAssignedNotification(userUUIDs, quiz) {
        const content = {
            title: `Quiz Assigned: ${quiz.title}`,
            body: `You have been assigned "${quiz.title}"`,
            imageUrl: quiz.imageUrl || null
        };

        const data = {
            type: 'quiz_assigned',
            quizId: quiz._id,
            dueDate: quiz.dueDate
        };

        return this.sendToUsers(userUUIDs, 'quiz_assigned', content, data);
    }

    /**
     * Send quiz completed notification
     */
    async sendQuizCompletedNotification(userUUID, quiz, score, totalMarks) {
        const percentage = Math.round((score / totalMarks) * 100);
        const content = {
            title: `Quiz Completed: ${percentage}%`,
            body: `You scored ${score}/${totalMarks} on "${quiz.title}"`,
            imageUrl: quiz.imageUrl || null
        };

        const data = {
            type: 'quiz_completed',
            quizId: quiz._id,
            score,
            totalMarks,
            percentage
        };

        return this.sendToUser(userUUID, 'quiz_completed', content, data);
    }

    /**
     * Send achievement notification
     */
    async sendAchievementNotification(userUUID, achievement) {
        const content = {
            title: 'Achievement Unlocked! 🏆',
            body: achievement.description,
            imageUrl: achievement.imageUrl
        };

        const data = {
            type: 'achievement_unlocked',
            achievementId: achievement._id,
            name: achievement.name
        };

        return this.sendToUser(userUUID, 'achievement_unlocked', content, data);
    }

    /**
     * Send grade released notification
     */
    async sendGradeReleasedNotification(userUUID, quiz, grade) {
        const content = {
            title: 'Grades Released',
            body: `Your grade for "${quiz.title}" is now available`,
            imageUrl: null
        };

        const data = {
            type: 'grade_released',
            quizId: quiz._id,
            grade
        };

        return this.sendToUser(userUUID, 'grade_released', content, data);
    }
}

module.exports = new FirebaseNotificationService();
```

### Service 2: Update Firebase Config

**File: `src/config/firebase.js`** (Copy from microservice and use same file)

```javascript
const admin = require('firebase-admin');
const config = require('./index');
const logger = require('../utils/logger');

let firebaseApp;

const initFirebase = () => {
    if (firebaseApp) return firebaseApp;

    try {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        
        if (!serviceAccountPath) {
            logger.warn('Firebase service account not configured.');
            return null;
        }

        let serviceAccount;
        if (serviceAccountPath.startsWith('{')) {
            // JSON string
            serviceAccount = JSON.parse(serviceAccountPath);
        } else {
            // File path
            serviceAccount = require(serviceAccountPath);
        }

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id,
        });

        logger.info('Firebase initialized successfully');
        return firebaseApp;
    } catch (error) {
        logger.error('Failed to initialize Firebase:', error.message);
        return null;
    }
};

const getFirebaseMessaging = () => {
    const app = initFirebase();
    return app ? admin.messaging(app) : null;
};

module.exports = {
    initFirebase,
    getFirebaseMessaging,
    admin
};
```

---

## API Endpoints

### Notification Endpoints

**File: `src/api/v1/routes/notification.routes.js`**

```javascript
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

// Device token management
router.post('/device-token', notificationController.registerDeviceToken);
router.delete('/device-token/:token', notificationController.unregisterDeviceToken);

// Notifications retrieval
router.get('/', notificationController.getNotifications);
router.patch('/:notificationId/read', notificationController.markRead);

module.exports = router;
```

**File: `src/api/v1/controllers/notification.controller.js`**

```javascript
const firebaseNotificationService = require('../../../services/firebase-notification.service');
const Notification = require('../../../models/Notification');
const logger = require('../../../utils/logger');

exports.registerDeviceToken = async (req, res) => {
    try {
        const { token, deviceType, deviceName, osVersion, appVersion } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Device token required' });
        }

        const device = await firebaseNotificationService.registerDeviceToken(
            req.user.uuid,
            token,
            { deviceType, deviceName, osVersion, appVersion }
        );

        res.json({ success: true, message: 'Device token registered', device });
    } catch (error) {
        logger.error('Error registering device token:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.unregisterDeviceToken = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ error: 'Device token required' });
        }

        await firebaseNotificationService.unregisterDeviceToken(token);
        res.json({ success: true, message: 'Device token unregistered' });
    } catch (error) {
        logger.error('Error unregistering device token:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ recipientUUID: req.user.uuid })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments({ recipientUUID: req.user.uuid });

        res.json({ success: true, notifications, total, page, limit });
    } catch (error) {
        logger.error('Error fetching notifications:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.markRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        if (!notificationId) {
            // Mark all as read
            await Notification.updateMany(
                { recipientUUID: req.user.uuid },
                { isRead: true, readAt: new Date() }
            );
            return res.json({ success: true, message: 'All marked as read' });
        }

        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        res.json({ success: true, notification });
    } catch (error) {
        logger.error('Error marking notification as read:', error);
        res.status(500).json({ error: error.message });
    }
};
```

### Internal API Routes (for Microservice to call)

**File: `src/api/v1/routes/internal.routes.js`**

```javascript
const express = require('express');
const router = express.Router();
const DeviceToken = require('../../../models/DeviceToken');
const logger = require('../../../utils/logger');

// Middleware to verify internal token
const authenticateInternal = (req, res, next) => {
    const token = req.headers['x-internal-token'];
    const expectedToken = process.env.MICROSERVICE_INTERNAL_TOKEN;

    if (token !== expectedToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
};

router.use(authenticateInternal);

/**
 * POST /api/v1/internal/device-tokens/sync
 * Microservice syncs device tokens registered on its side
 */
router.post('/device-tokens/sync', async (req, res) => {
    try {
        const { userUUID, token, deviceInfo } = req.body;

        if (!userUUID || !token) {
            return res.status(400).json({ error: 'userUUID and token required' });
        }

        let device = await DeviceToken.findOne({ token });

        if (device) {
            if (device.userUUID !== userUUID) {
                await DeviceToken.updateOne(
                    { token },
                    { userUUID, ...deviceInfo, isInvalid: false }
                );
            }
        } else {
            await DeviceToken.create({
                userUUID,
                token,
                ...(deviceInfo || {}),
                isInvalid: false
            });
        }

        res.json({ success: true, message: 'Device token synced' });
    } catch (error) {
        logger.error('Error syncing device token:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/v1/internal/device-tokens/:userUUID
 * Microservice requests device tokens for sending notifications
 */
router.get('/device-tokens/:userUUID', async (req, res) => {
    try {
        const { userUUID } = req.params;

        const devices = await DeviceToken.find({ userUUID, isInvalid: false });

        res.json({ success: true, data: devices });
    } catch (error) {
        logger.error('Error fetching device tokens:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/v1/internal/device-tokens/mark-invalid
 * Microservice marks tokens as invalid
 */
router.post('/device-tokens/mark-invalid', async (req, res) => {
    try {
        const { tokens } = req.body;

        if (!Array.isArray(tokens)) {
            return res.status(400).json({ error: 'tokens array required' });
        }

        await DeviceToken.updateMany(
            { token: { $in: tokens } },
            { isInvalid: true }
        );

        res.json({ success: true, message: `Marked ${tokens.length} tokens invalid` });
    } catch (error) {
        logger.error('Error marking tokens invalid:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

---

## Notification Triggers

### Trigger 1: Auth Login

**File: `src/services/auth.service.js`** (UPDATE)

```javascript
const firebaseNotificationService = require('./firebase-notification.service');

class AuthService {
    async login(email, password, deviceInfo) {
        try {
            // ... existing login logic ...
            const user = await User.findOne({ email });

            if (user) {
                // Send login notification
                await firebaseNotificationService.sendAuthNotification(
                    user.uuid,
                    {
                        deviceName: deviceInfo?.deviceName || 'Web Browser',
                        location: deviceInfo?.location,
                        ipAddress: deviceInfo?.ipAddress,
                        timestamp: new Date()
                    }
                );
            }

            return user;
        } catch (error) {
            logger.error('Login failed:', error);
            throw error;
        }
    }
}

module.exports = new AuthService();
```

**Update auth controller:**

```javascript
exports.login = async (req, res) => {
    try {
        const user = await authService.login(req.body.email, req.body.password, {
            deviceName: req.body.deviceName || req.get('user-agent'),
            ipAddress: req.ip
        });

        res.json({ success: true, user, token: generateToken(user) });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};
```

### Trigger 2: Quiz Assignment

**File: `src/services/quiz.service.js`** (UPDATE)

```javascript
const firebaseNotificationService = require('./firebase-notification.service');

class QuizService {
    async assignQuizToStudents(quizId, studentUUIDs) {
        try {
            const quiz = await Quiz.findById(quizId);
            
            // Create assignments...
            await Assignment.create({
                quizId,
                studentUUIDs,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });

            // Send notifications
            await firebaseNotificationService.sendQuizAssignedNotification(
                studentUUIDs,
                {
                    _id: quiz._id,
                    title: quiz.title,
                    description: quiz.description,
                    totalQuestions: quiz.questions.length,
                    imageUrl: quiz.imageUrl
                }
            );

            return { success: true, assigned: studentUUIDs.length };
        } catch (error) {
            logger.error('Failed to assign quiz:', error);
            throw error;
        }
    }
}

module.exports = new QuizService();
```

### Trigger 3: Quiz Submission

**File: `src/services/quiz.service.js`** (UPDATE)

```javascript
class QuizService {
    async submitQuiz(quizId, studentUUID, answers) {
        try {
            const quiz = await Quiz.findById(quizId);
            
            // Calculate score...
            let score = 0;
            quiz.questions.forEach(question => {
                const studentAnswer = answers[question._id];
                if (studentAnswer === question.correctAnswer) {
                    score += question.marks;
                }
            });

            // Save result
            const result = await QuizResult.create({
                quizId,
                studentUUID,
                score,
                totalMarks: quiz.totalMarks,
                submittedAt: new Date()
            });

            // Send completion notification
            await firebaseNotificationService.sendQuizCompletedNotification(
                studentUUID,
                quiz,
                score,
                quiz.totalMarks
            );

            return result;
        } catch (error) {
            logger.error('Failed to submit quiz:', error);
            throw error;
        }
    }
}
```

### Trigger 4: Grade Release

**File: `src/services/quiz.service.js`** (UPDATE)

```javascript
class QuizService {
    async releaseGrades(quizId) {
        try {
            const quiz = await Quiz.findById(quizId);
            const results = await QuizResult.find({ quizId });

            // Notify all students
            for (const result of results) {
                await firebaseNotificationService.sendGradeReleasedNotification(
                    result.studentUUID,
                    quiz,
                    result.score
                );
            }

            return { success: true, notified: results.length };
        } catch (error) {
            logger.error('Failed to release grades:', error);
            throw error;
        }
    }
}
```

### Trigger 5: Achievement Unlocked

**File: `src/services/achievement.service.js`** (NEW or UPDATE)

```javascript
const firebaseNotificationService = require('./firebase-notification.service');

class AchievementService {
    async unlockAchievement(userUUID, achievementId) {
        try {
            const achievement = await Achievement.findById(achievementId);
            
            // Record achievement for user
            await UserAchievement.create({
                userUUID,
                achievementId,
                unlockedAt: new Date()
            });

            // Send notification
            await firebaseNotificationService.sendAchievementNotification(
                userUUID,
                achievement
            );

            return achievement;
        } catch (error) {
            logger.error('Failed to unlock achievement:', error);
            throw error;
        }
    }
}

module.exports = new AchievementService();
```

---

## Cross-Server Syncing

### How Syncing Works

```
Quiz Server Flow:
1. Send notification to Firebase ✅
2. Store in Quiz Server DB ✅
3. Call Microservice API to sync ✅
   POST /api/v1/internal/notifications/sync
   
Microservice Flow:
1. Send notification to Firebase ✅
2. Store in Microservice DB ✅
3. Also sends? No - handled by sender
```

### Device Token Sync Flow

```
User registers token on Mobile App
       ↓
Frontend calls POST /api/v1/notifications/device-token
       ↓
Quiz Server stores token
       ↓
Quiz Server calls POST /api/v1/internal/device-tokens/sync
       ↓
Microservice stores copy of token
       ↓
Both servers can now send notifications to this device
```

### Automatic Sync Service

**File: `src/services/sync.service.js`** (OPTIONAL - for periodic syncs)

```javascript
const axios = require('axios');
const DeviceToken = require('../models/DeviceToken');
const config = require('../config');
const logger = require('../utils/logger');

class SyncService {
    /**
     * Periodically sync device tokens with microservice
     * Run every 1 hour
     */
    async syncDeviceTokens() {
        try {
            const tokens = await DeviceToken.find({ isInvalid: false });

            for (const token of tokens) {
                try {
                    await axios.post(
                        `${config.microservice.url}/api/v1/internal/device-tokens/sync`,
                        {
                            userUUID: token.userUUID,
                            token: token.token,
                            deviceInfo: {
                                deviceType: token.deviceType,
                                deviceName: token.deviceName,
                                osVersion: token.osVersion
                            }
                        },
                        {
                            headers: {
                                'X-Internal-Token': config.microservice.internalToken
                            },
                            timeout: 3000
                        }
                    );
                } catch (error) {
                    logger.warn(`Failed to sync token ${token.token}:`, error.message);
                }
            }

            logger.info(`Synced ${tokens.length} device tokens with microservice`);
        } catch (error) {
            logger.error('Device token sync failed:', error);
        }
    }
}

module.exports = new SyncService();
```

Initialize sync in server.js:

```javascript
const syncService = require('./services/sync.service');

// Start sync every 60 minutes
setInterval(() => {
    syncService.syncDeviceTokens().catch(err => logger.error('Sync error:', err));
}, 60 * 60 * 1000);
```

---

## Complete Examples

### Example 1: Register Device Token

**Frontend (React):**

```javascript
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  projectId: "edulearn-ce604",
  // ... other config
};

const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

async function registerDeviceToken(authToken) {
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
    });

    // Send to Quiz Server
    const response = await fetch('http://localhost:3000/api/v1/notifications/device-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        token,
        deviceType: 'web',
        deviceName: navigator.userAgent,
        osVersion: navigator.platform,
        appVersion: '1.0.0'
      })
    });

    const data = await response.json();
    console.log('Device registered:', data);
  } catch (error) {
    console.error('Failed to register device:', error);
  }
}

// Call on app load
registerDeviceToken(authToken);
```

### Example 2: Send Notification from Quiz Server

**API Call:**

```bash
curl -X POST http://localhost:3000/api/v1/quizzes/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "quizId": "123abc",
    "studentUUIDs": ["student-1", "student-2", "student-3"]
  }'
```

**Quiz Controller:**

```javascript
const quizService = require('../../../services/quiz.service');

exports.assignQuiz = async (req, res) => {
    try {
        const { quizId, studentUUIDs } = req.body;

        const result = await quizService.assignQuizToStudents(quizId, studentUUIDs);

        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

### Example 3: Check Notification History

**API Call:**

```bash
curl http://localhost:3000/api/v1/notifications?page=1&limit=10 \
 -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "notifications": [
    {
      "_id": "123",
      "recipientUUID": "student-uuid",
      "type": "quiz_assigned",
      "content": {
        "title": "Quiz Assigned",
        "body": "New quiz: JavaScript Basics"
      },
      "isRead": false,
      "createdAt": "2026-04-02T08:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 10
}
```

---

## Testing

### Test 1: Firebase Connection

```javascript
// node tests/test-firebase.js
const { initFirebase, getFirebaseMessaging } = require('../src/config/firebase');

const app = initFirebase();
const messaging = getFirebaseMessaging();

console.log('Firebase initialized:', app ? 'YES' : 'NO');
console.log('Messaging available:', messaging ? 'YES' : 'NO');
```

### Test 2:  Manual Token Registration

```bash
# Register a test device token
curl -X POST http://localhost:3000/api/v1/notifications/device-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "token": "test-firebase-token-12345",
    "deviceType": "web",
    "deviceName": "Test Device"
  }'
```

### Test 3: Internal API Sync

```bash
# Test device token sync endpoint
curl -X POST http://localhost:3000/api/v1/internal/device-tokens/sync \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: edulearn-microservice-secret-internal-token-change-in-prod" \
  -d '{
    "userUUID": "user-uuid-123",
    "token": "firebase-token-sync-test",
    "deviceInfo": {
      "deviceType": "ios",
      "deviceName": "iPhone 13"
    }
  }'
```

---

## Troubleshooting

### Issue 1: Firebase Credentials Error

**Error:** `Error: Invalid service account provided`

**Solution:**
1. Check `firebase-service-account.json` exists
2. Verify JSON is valid (no corruption)
3. Check all required fields are present
4. Verify `FIREBASE_SERVICE_ACCOUNT_JSON` env variable points to correct file

### Issue 2: Cannot Find Module

**Error:** `Cannot find module '../../../repositories/device-token.repository'`

**Solution:**
1. Ensure file exists at correct path
2. Check file name spelling
3. Verify path is correct from current file location

### Issue 3: Microservice Sync Fails

**Error:** `Failed to sync notification with microservice`

**Solution:**
1. Check `MICROSERVICE_URL` is correct in .env
2. Verify `MICROSERVICE_INTERNAL_TOKEN` matches on both servers
3. Check microservice is running
4. Verify network connectivity between servers

### Issue 4: Invalid Tokens

**Error:** `messaging/invalid-registration-token`

**Solution:**
1. This is normal - Firebase rejects expired tokens
2. System automatically marks these as invalid
3. They'll be cleaned up automatically

### Issue 5: No Devices Found

**Error:** `No devices registered for user`

**Solution:**
1. Ensure frontend called device token endpoint
2. Check tokens are being stored in MongoDB
3. Verify `isInvalid: false` in database
4. Check correct userUUID is being used

---

## Production Checklist

- [ ] Set strong `MICROSERVICE_INTERNAL_TOKEN` (32+ chars)
- [ ] Use Firebase service account securely
- [ ] Enable HTTPS on both servers
- [ ] Set up monitoring for notifications
- [ ] Configure Firebase rate limits
- [ ] Test cross-server notification delivery
- [ ] Set up log aggregation
- [ ] Schedule periodic token cleanup
- [ ] Document all notification types
- [ ] Set up error alerts
- [ ] Load test notification endpoints
- [ ] Backup Firebase credentials securely

---

## Summary

This guide covers everything needed to implement Firebase notifications on your Quiz Server with full syncing to the Microservice. The key points are:

1. **Same Firebase Project** - Both servers use same credentials
2. **Device Tokens in Both DBs** - Sync happens automatically
3. **Notification Triggers** - 5 main triggers on Quiz Server
4. **Cross-Server Communication** - Via internal API with token authentication
5. **Automatic Cleanup** - Invalid tokens marked and removed periodically

Follow this guide step-by-step and you'll have a fully functional notification system! 🚀
