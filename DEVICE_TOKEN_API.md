# Device Token Registration API - Complete Guide

## Overview

This API endpoint allows your React Native/Web app to register Firebase device tokens with the microservice. The tokens are stored and synced with the Quiz Server.

**Your User ID (quizServerUUID)** is the key identifier - it's your actual account ID from the Quiz Server, and it's what we use to send you notifications.

---

## Endpoint

### Register Device Token

**URL:** `POST /api/v1/notifications/device-token`

**Base URL:** `http://your-microservice-url:4001`

### Authentication

**Required:** Bearer Token (from Quiz Server login)

```
Authorization: Bearer YOUR_AUTH_TOKEN
```

### Request Body

```json
{
  "token": "firebase-device-token-xxx",
  "deviceType": "ios|android|web",
  "deviceName": "iPhone 14 Pro",
  "osVersion": "17.2",
  "appVersion": "1.0.0",
  "email": "user@example.com"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | ✅ Yes | Firebase/Expo push token from your device |
| `deviceType` | string | ✅ Yes | Device type: `ios`, `android`, or `web` |
| `deviceName` | string | ❌ Optional | Your device name (e.g., "iPhone 14", "Samsung S23") |
| `osVersion` | string | ❌ Optional | OS version (e.g., "17.2", "Android 13") |
| `appVersion` | string | ❌ Optional | App version (e.g., "1.0.0") |
| `email` | string | ❌ Optional | User email address (e.g., "user@example.com") |

### Response - Success (200)

```json
{
  "status": "success",
  "message": "Device token registered",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userUUID": "user-uuid-from-quiz-server",
    "token": "firebase-device-token-xxx",
    "deviceType": "ios",
    "deviceName": "iPhone 14 Pro",
    "osVersion": "17.2",
    "appVersion": "1.0.0",
    "email": "user@example.com",
    "isInvalid": false,
    "lastUsed": "2026-04-02T08:30:00Z",
    "createdAt": "2026-04-02T08:30:00Z",
    "updatedAt": "2026-04-02T08:30:00Z"
  }
}
```

### Response - Error

**Missing Token (400)**
```json
{
  "status": "error",
  "message": "Device token is required"
}
```

**Unauthorized (401)**
```json
{
  "status": "error",
  "message": "Unauthorized"
}
```

---

## Complete Examples

### Example 1: React Native (Expo)

```javascript
import * as Notifications from 'expo-notifications';
import { getDeviceNameAsync } from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

async function registerDeviceToken(authToken, quizServerUUID, userEmail) {
  try {
    // Get Expo push token
    const expoPushToken = (
      await Notifications.getExpoPushTokenAsync()
    ).data;

    // Get device info
    const deviceName = await getDeviceNameAsync();
    const osVersion = Platform.OS === 'ios' ? 
      Platform.Version : 
      `Android ${Platform.Version}`;
    const appVersion = Constants.expoConfig?.version || '1.0.0';

    // Register token
    const response = await fetch(
      'http://localhost:4001/api/v1/notifications/device-token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          token: expoPushToken,
          deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
          deviceName: deviceName || 'Unknown Device',
          osVersion: osVersion,
          appVersion: appVersion,
          email: userEmail
        })
      }
    );

    const data = await response.json();

    if (data.status === 'success') {
      console.log('✅ Device registered:', data.data);
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Failed to register device:', error);
    throw error;
  }
}

// Usage:
// await registerDeviceToken(authToken, user.quizServerUUID);
```

### Example 2: React Native (Firebase Cloud Messaging)

```javascript
import messaging from '@react-native-firebase/messaging';
import { Platform, Dimensions } from 'react-native';
import * as Device from 'expo-device';

async function registerDeviceTokenRN(authToken, quizServerUUID, userEmail) {
  try {
    // Get FCM token
    const fcmToken = await messaging().getToken();

    // Get device info
    const deviceName = Device.deviceName;
    const osVersion = `${Platform.OS} ${Platform.Version}`;
    const appVersion = '1.0.0'; // Get from your app config

    // Register
    const response = await fetch(
      'http://localhost:4001/api/v1/notifications/device-token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          token: fcmToken,
          deviceType: Platform.OS,
          deviceName: deviceName || 'Unknown',
          osVersion: osVersion,
          appVersion: appVersion,
          email: userEmail
        })
      }
    );

    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error(data.message);
    }

    console.log('✅ Device token registered');
    return data.data;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}
```

### Example 3: Web (React)

```javascript
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  projectId: "edulearn-ce604",
  // ... other config
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

async function registerWebDeviceToken(authToken, quizServerUUID, userEmail) {
  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: 'BOiy3MKWfS5AYytJWPn65dNtlgBm-MyBtrSwWoYz_cJKJiRVhWDtSmBgV37HudhHgQEc8D3YrvhnuVzwBAdWEfQ'
    });

    // Register with backend
    const response = await fetch(
      'http://localhost:4001/api/v1/notifications/device-token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          token: token,
          deviceType: 'web',
          deviceName: navigator.userAgent.substring(0, 100),
          osVersion: navigator.platform,
          appVersion: '1.0.0',
          email: userEmail
        })
      }
    );

    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error(data.message);
    }

    console.log('✅ Web device registered');
    return data.data;
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}
```

### Example 4: cURL

```bash
curl -X POST http://localhost:4001/api/v1/notifications/device-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "token": "exponent-push-token[xxxxxxxxxxxxxx]",
    "deviceType": "ios",
    "deviceName": "iPhone 14 Pro",
    "osVersion": "17.2",
    "appVersion": "1.0.0",
    "email": "user@example.com"
  }'
```

---

## Complete Registration Flow

### Step 1: User Logs In
```
User enters credentials → Quiz Server authenticates → Returns authToken + quizServerUUID
```

### Step 2: App Requests Permissions
```
App → Requests notification permission from device → User grants/denies
```

### Step 3: Get Push Token
```
App → Firebase → Returns device push token (unique for this device)
```

### Step 4: Register Token with Microservice
```
App → POST /api/v1/notifications/device-token
Body includes:
  - Push token from Firebase
  - Device info (name, OS, etc)
  - Authorization: Bearer TOKEN
```

### Step 5: Microservice Stores & Syncs
```
Microservice:
  1. Stores in MongoDB with userUUID (your quizServerUUID)
  2. Calls Quiz Server internal API to sync
  3. Returns success response
```

### Step 6: Both Servers Can Now Send Notifications
```
Quiz Server sends:
  - Auth events
  - Quiz assignments
  - Grades
  - Achievements
  
Microservice sends:
  - Friend requests
  - Messages
  - Feed posts
  - Group invites
```

---

## Data Flow Diagram

```
Your React Native App
        ↓
   Request notification permission
        ↓
   Get Firebase push token
        ↓
   POST /api/v1/notifications/device-token
   (with authToken header)
        ↓
  Microservice MongoDB
  (stores with your quizServerUUID)
        ↓
  Internal API sync to Quiz Server
        ↓
  Quiz Server MongoDB
  (copy of your token)
        ↓
  Now both servers can send you notifications!
```

---

## Key Points

✅ **Your User ID:** `quizServerUUID` is your actual account ID from Quiz Server  
✅ **Device Token:** Unique for each device (phone, tablet, etc)  
✅ **One Token per Device:** Each device registers once  
✅ **Automatic Sync:** Quiz Server gets copy of your tokens via internal API  
✅ **Notifications:** Both servers can send to all your registered devices  
✅ **Cleanup:** Invalid tokens auto-deleted after 30 days  

---

## Unregister Token

When user logs out, unregister the token:

```javascript
async function unregisterDeviceToken(authToken, token) {
  const response = await fetch(
    `http://localhost:4001/api/v1/notifications/device-token/${token}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    }
  );

  const data = await response.json();
  console.log('Device token unregistered');
}
```

---

## Troubleshooting

### Token not being sent
- Check notification permission is granted
- Verify app has internet access
- Check auth token is valid

### Getting 401 Unauthorized
- Verify auth token is correct
- Check token hasn't expired
- Try logging in again

### Token not appearing in Quiz Server
- Check microservice is running
- Verify MICROSERVICE_INTERNAL_TOKEN matches
- Check Firebase is initialized on startup

### Not receiving notifications
- Verify token is registered (check MongoDB)
- Check notification is being triggered from Quiz Server or Microservice
- Verify Firebase project is configured correctly

---

## Production Notes

- Use your actual microservice URL (not localhost)
- Ensure HTTPS is enabled
- Keep auth tokens secure
- Test with real devices, not just emulators
- Monitor notification delivery in Firebase Console
