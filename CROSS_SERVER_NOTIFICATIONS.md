# Cross-Server Firebase Notifications Architecture

## Overview
Both your **Quiz Server** and **Microservice** can send Firebase notifications to users. They share the same Firebase project and user device tokens.

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Cloud Messaging                  │
│                    (Shared Project)                           │
└────────────┬──────────────────────────────────┬──────────────┘
             │                                  │
    ┌────────▼────────┐              ┌─────────▼─────────┐
    │  Quiz Server    │              │   Microservice    │
    │  - Auth events  │              │  - Friend requests│
    │  - Achievements │              │  - Messages       │
    │  - Quiz updates │              │  - Feed posts     │
    └────────┬────────┘              │  - Group invites  │
             │                       └─────────┬─────────┘
             │                                 │
             └────────────────┬────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Device Tokens    │
                    │  (Shared Storage) │
                    │  - Firebase DB    │
                    │  - Or both via    │
                    │    internal API   │
                    └───────────────────┘
```

## Database Considerations

You have two options for device tokens:

### Option 1: Separate Databases (Recommended)
- **Quiz Server**: Stores device tokens in its own MongoDB
- **Microservice**: Stores device tokens in its own MongoDB
- **Sync**: When user registers on Quiz Server, microservice calls Quiz Server API to get token
- **Benefit**: Independent, no cross-server database access

### Option 2: Shared Access
- Both servers write to same device token DB
- Single source of truth
- Requires shared MongoDB connection string

## Implementation Strategy

### 1. Quiz Server Setup (Node.js)
```javascript
// quiz-server/src/config/firebase.js - SAME AS MICROSERVICE
// quiz-server/src/services/firebase-notification.service.js - SAME AS MICROSERVICE
// quiz-server/src/repositories/device-token.repository.js - ADAPTED FOR QUIZ SERVER
```

### 2. Notification Triggers

**From Quiz Server** (Fire when these happen):
- User logs in → "user_logged_in"
- Quiz completed → "quiz_completed"
- Achievement unlocked → "achievement_unlocked"
- Quiz created by teacher → "quiz_assigned"

**From Microservice** (Fire when these happen):
- Friend request sent → "friend_request"
- Message received → "message_received"
- Post liked → "post_liked"
- Group invite → "group_invite"

### 3. Cross-Server Device Token Sync

When user device registers on one server, ensure both servers know about it:

**Option A: Pull Model (Microservice asks Quiz Server)**
```javascript
// When microservice needs to send notification
1. Get user's device tokens from Quiz Server API
2. Send via Firebase
3. Store failed tokens back to Quiz Server
```

**Option B: Push Model (Both servers write to separate DBs, sync periodically)**
```javascript
// Device registers on Quiz Server
1. Quiz Server registers token in Quiz Server DB
2. Quiz Server also notifies Microservice
3. Microservice stores copy of token

// Device registers on Microservice  
1. Microservice registers token
2. Microservice notifies Quiz Server
3. Quiz Server stores copy of token
```

**Option C: Unified API (Recommended)**
```javascript
// Create a separate Auth/Device Service
// Both servers call this to:
// - Register tokens
// - Get user tokens
// - Mark tokens invalid
```

## Critical: Firebase Service Account

Both servers MUST use the **SAME** Firebase service account!

```env
# On BOTH servers
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project",...}
```

This ensures:
- Same FCM project
- Tokens are valid on both servers
- No conflicts or errors
