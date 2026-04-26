# Complete Device Token & Notification Flow

## Your Setup

```
Your User ID = quizServerUUID (from Quiz Server)
Example: "user-123-uuid-456"

Your Device ID = Firebase Device Token
Example: "exponent-push-token[xxxxx]"
```

---

## Complete User Flow

### 1. User Logs In (Quiz Server)
```
Mobile App
    ↓
[Login Screen]
Enter email/password
    ↓
Quiz Server: POST /api/v1/auth/login
    ↓
Returns:
{
  "token": "jwt-auth-token-xxx",
  "user": {
    "uuid": "user-123-uuid-456",    ← Your quizServerUUID
    "name": "Adil",
    "email": "adil@example.com"
  }
}
    ↓
App stores token in AsyncStorage
```

### 2. App Initializes Notifications
```
App.js useEffect
    ↓
Request notification permission
User grants permission
    ↓
Setup notification listeners
    ↓
App ready to receive notifications
```

### 3. Register Device Token
```
React Native App
    ↓
Calls: registerDeviceToken(authToken, quizServerUUID, userEmail)
    ↓
Gets Firebase push token from Expo/FCM
Example: "exponent-push-token[xxxxxxxx]"
    ↓
GET device info:
- Device type: iPhone / Android / Web
- Device name: "iPhone 14 Pro"
- OS Version: "17.2"
- App Version: "1.0.0"
- Email: "user@example.com"
    ↓
POST to Microservice:
/api/v1/notifications/device-token
{
  "token": "exponent-push-token[xxxxxxxx]",
  "deviceType": "ios",
  "deviceName": "iPhone 14 Pro",
  "osVersion": "17.2",
  "appVersion": "1.0.0",
  "email": "user@example.com"
}

Headers:
- Authorization: Bearer jwt-auth-token-xxx
    ↓
Microservice extracts quizServerUUID from JWT
    ↓
Stores in MongoDB:
{
  "_id": ObjectId,
  "userUUID": "user-123-uuid-456",  ← Your quizServerUUID
  "token": "exponent-push-token[xxxxxxxx]",
  "deviceType": "ios",
  "email": "user@example.com",
  "isInvalid": false,
  "createdAt": "2026-04-02T..."
}
    ↓
Microservice calls Quiz Server internal API:
POST /api/v1/internal/device-tokens/sync
{
  "userUUID": "user-123-uuid-456",
  "token": "exponent-push-token[xxxxxxxx]",
  "deviceInfo": {...}
}

Headers:
- X-Internal-Token: social-microservice-secret-8923
    ↓
Quiz Server stores copy in its MongoDB
    ↓
Both servers now have your device token!
```

### 4. Receive Notifications

#### From Quiz Server (Auth Events, Quizzes, Grades):
```
Quiz Server Event
(User logs in / Quiz assigned / Grade released)
    ↓
Quiz Server gets your device tokens via:
GET /api/v1/internal/device-tokens/user-123-uuid-456
    ↓
Calls Firebase:
messaging.sendMulticast({
  tokens: [
    "exponent-push-token[xxxxx]",  // Your device
    ...other tokens
  ],
  notification: {
    title: "New Quiz Assigned",
    body: "JavaScript Basics"
  },
  data: {
    quizId: "quiz-123",
    type: "quiz_assigned"
  }
})
    ↓
Firebase sends to all your registered devices
```

#### From Microservice (Messages, Friend Requests, Posts):
```
Microservice Event
(Friend request sent / Message received / Post liked)
    ↓
Microservice calls:
firebaseNotificationService.sendToUser(
  "user-123-uuid-456",
  "friend_request",
  { title, body, imageUrl },
  { data }
)
    ↓
Gets your device tokens from MongoDB
    ↓
Calls Firebase:
messaging.sendMulticast({
  tokens: [your device tokens],
  notification: {...},
  data: {...}
})
    ↓
Firebase sends to your devices
```

### 5. User Receives Notification on Phone

```
Firebase → Your Device
    ↓
App in Foreground?
    ↓
Yes: Show notification + trigger onMessage listener
No: Show system notification
    ↓
User sees notification on phone
    ↓
User taps notification
    ↓
App navigates to relevant screen
(quiz details / chat / friend requests, etc)
```

### 6. User Logs Out
```
Logout button clicked
    ↓
Unregister device token:
DELETE /api/v1/notifications/device-token/exponent-push-token[xxxxx]

Headers:
- Authorization: Bearer jwt-auth-token-xxx
    ↓
Microservice deletes token from MongoDB
    ↓
Token removed from your account
    ↓
No more notifications to this device
```

---

## Database Schema

### Microservice MongoDB (edulearn-social)

**Collection: devicetokens**
```
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "userUUID": "user-123-uuid-456",           ← Your ID!
  "token": "exponent-push-token[xxxxx]",     ← Unique per device
  "deviceType": "ios",
  "deviceName": "iPhone 14 Pro",
  "osVersion": "17.2",
  "appVersion": "1.0.0",
  "isInvalid": false,
  "lastUsed": ISODate("2026-04-02T08:30:00Z"),
  "createdAt": ISODate("2026-04-02T08:00:00Z"),
  "updatedAt": ISODate("2026-04-02T08:30:00Z")
}
```

### Quiz Server MongoDB (quiz-server)

**Collection: devicetokens** (synced copy)
```
{
  "_id": ObjectId("..."),
  "userUUID": "user-123-uuid-456",
  "token": "exponent-push-token[xxxxx]",
  ... (same as microservice)
}
```

---

## API Endpoints Summary

### Frontend → Microservice

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/v1/notifications/device-token` | Register token | Bearer Token |
| DELETE | `/api/v1/notifications/device-token/:token` | Unregister token | Bearer Token |
| GET | `/api/v1/notifications` | Get notifications | Bearer Token |
| PATCH | `/api/v1/notifications/:id/read` | Mark as read | Bearer Token |

### Quiz Server → Microservice (Internal)

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/v1/internal/device-tokens/sync` | Sync token from quiz server | X-Internal-Token |
| GET | `/api/v1/internal/device-tokens/:userUUID` | Get all tokens for user | X-Internal-Token |
| POST | `/api/v1/internal/device-tokens/mark-invalid` | Mark tokens invalid | X-Internal-Token |
| POST | `/api/v1/internal/notifications/sync` | Sync notification | X-Internal-Token |

---

## Environment Variables

### Microservice `.env`
```env
# Firebase
FIREBASE_SERVICE_ACCOUNT_JSON=./config/firebase-service-account.json
FIREBASE_VAPID_PUBLIC_KEY=BOiy3MKWfS5AYytJWPn65dNtlgBm-MyBtrSwWoYz_cJKJiRVhWDtSmBgV37HudhHgQEc8D3YrvhnuVzwBAdWEfQ

# Internal communication
MICROSERVICE_INTERNAL_TOKEN=social-microservice-secret-8923

# Quiz Server
QUIZ_SERVER_URL=https://romantic-nanete-adildevelopment-3ec66986.koyeb.app
```

### Quiz Server `.env`
```env
# Firebase (SAME project as microservice)
FIREBASE_SERVICE_ACCOUNT_JSON=./config/firebase-service-account.json
FIREBASE_VAPID_PUBLIC_KEY=BOiy3MKWfS5AYytJWPn65dNtlgBm-MyBtrSwWoYz_cJKJiRVhWDtSmBgV37HudhHgQEc8D3YrvhnuVzwBAdWEfQ

# Internal communication (MUST MATCH microservice)
MICROSERVICE_INTERNAL_TOKEN=social-microservice-secret-8923

# Microservice URLs
MICROSERVICE_URL=http://localhost:3001
```

---

## React Native Code - Quick Start

```javascript
import * as Notifications from 'expo-notifications';
import { getDeviceNameAsync } from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// In your login screen or app initialization
async function setupNotifications(authToken, quizServerUUID) {
  // 1. Request permission
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  // 2. Get device info
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  const deviceName = await getDeviceNameAsync();
  const osVersion = Platform.OS === 'ios' ? Platform.Version : `Android ${Platform.Version}`;

  // 3. Register token with API
  const response = await fetch(
    'http://your-microservice:4001/api/v1/notifications/device-token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        token,
        deviceType: Platform.OS,
        deviceName: deviceName || 'Unknown Device',
        osVersion,
        appVersion: Constants.expoConfig?.version || '1.0.0'
      })
    }
  );

  const data = await response.json();
  if (data.status === 'success') {
    console.log('✅ Device registered! Ready for notifications');
    return true;
  } else {
    console.error('❌ Failed:', data.message);
    return false;
  }
}

// Usage:
// await setupNotifications(authToken, user.quizServerUUID);
```

---

## Notification Types

### From Quiz Server
- `auth_login` - New login detected
- `quiz_assigned` - Quiz assigned to you  
- `quiz_completed` - You completed a quiz
- `achievement_unlocked` - Achievement earned
- `grade_released` - Grades are available

### From Microservice
- `friend_request` - Friend request received
- `friend_accepted` - Friend request accepted
- `message_received` - New message
- `group_invite` - Invited to group
- `post_liked` - Someone liked your post
- `post_commented` - Someone commented on your post
- `mention` - You were mentioned

---

## Testing Checklist

- [ ] Firebase project created (edulearn-ce604)
- [ ] Service account file saved
- [ ] VAPID key added to .env
- [ ] Microservice running
- [ ] Device token endpoint works
- [ ] Token stored in MongoDB
- [ ] Quiz Server can read tokens via internal API
- [ ] React Native app sends token on login
- [ ] Receive test notification from Quiz Server
- [ ] Receive test notification from Microservice
- [ ] Tapping notification navigates correctly
- [ ] Logout unregisters token

---

## Key Takeaways

✅ **Your ID** = `quizServerUUID` (same across both servers)  
✅ **Device Token** = Unique Firebase token per device  
✅ **Auto-Sync** = Microservice syncs tokens to Quiz Server  
✅ **Dual Send** = Both servers can send you notifications  
✅ **Secure** = Only authenticated users can register tokens  
✅ **Cleanup** = Invalid tokens auto-removed after 30 days  

Now you're ready to receive notifications from both servers! 🚀
