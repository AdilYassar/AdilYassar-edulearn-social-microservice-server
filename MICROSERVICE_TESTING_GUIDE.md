# Microservice Notification Testing Guide

## Quick Start

You now have two test scripts for the microservice, just like the Quiz Server:

### Test 1: Debug Script (Check Setup)

```bash
node tests/debug-notification-delivery.js
```

**What it does:**
- Connects to the shared database (edulearn-social)
- Retrieves device tokens registered from Quiz Server
- Verifies Firebase is initialized
- Sends 3-4 test messages to check connectivity
- Shows detailed troubleshooting info

**Expected output:**
```
🔍 Microservice Firebase Notification Delivery Debugger
═══════════════════════════════════════════════...

1️⃣ Connecting to database...
   ✅ Connected to edulearn-social database

2️⃣ Checking device tokens...
   ✅ Found 1 device(s):

   Device 1:
   ├─ Name: iPhone 14 Pro
   ├─ Type: ios
   ├─ OS: 17.2
   ├─ App: 1.0.0
   ├─ Token: ExponentPushToken[xxxxx]...
   ├─ Invalid: ✅ NO
   ...

3️⃣ Initializing Firebase...
   ✅ Firebase ready

4️⃣ Sending test messages...

   TEST 1: Data-only message (background)
   ✅ Sent: abc123def456...
   ...
```

### Test 2: Full Send Script (Actual Notification)

```bash
node tests/test-notification-send.js
```

**What it does:**
- Connects to shared database
- Initializes Firebase
- Retrieves all device tokens for the test user
- Sends a real multicast notification via Firebase
- Stores the notification record in the database
- Marks any invalid tokens automatically
- Shows detailed results

**Expected output:**
```
🚀 Microservice Firebase Notification Test Script
══════════════════════════════════════════════════

1️⃣ Connecting to database...
✅ Connected to edulearn-social (shared database)

2️⃣ Initializing Firebase...
   Firebase App: Initialized
   Messaging: Ready
   Has sendMulticast: Yes
✅ Firebase initialized

3️⃣ Fetching device tokens for user: e05bb02d-d4d4-468d-8436-6ba765ff8e99
✅ Found 1 device(s):
   1. iPhone 14 Pro (ios)
      Token: ExponentPushToken[xxxxx]...
      Valid: ✅ YES

4️⃣ Sending notification via Firebase Cloud Messaging...
✅ Firebase request completed

   📊 Results:
      ✅ Successful: 1/1
      ❌ Failed: 0/1

   📋 Per-device responses:
      ✅ iPhone 14 Pro: Message ID: abc123def456xyz789

5️⃣ Storing notification in Microservice DB...
✅ Notification stored with ID: 507f191e810c19729de860ea

📊 Test Summary
═════════════════════════════════════════
User UUID: e05bb02d-d4d4-468d-8436-6ba765ff8e99
Devices: 1 (1 valid)
Firebase Success: 1/1
Stored in DB: Yes
Database: edulearn-social
═════════════════════════════════════════

✅ SUCCESS! Check your device for the notification.
   It may take a few seconds to arrive.
   The notification is from the MICROSERVICE.
```

---

## Testing Workflow

### Step 1: Verify Setup
```bash
node tests/debug-notification-delivery.js
```
**Check:** Database connected? Firebase ready? Devices found?

### Step 2: Send Test Notification
```bash
node tests/test-notification-send.js
```
**Check:** Did you see the notification on your device?

### Step 3: Verify Both Servers Work
```bash
# Quiz Server test (from Quiz Server directory)
npx tsx tests/test-notifications.js

# Microservice test (from microservice directory)
node tests/test-notification-send.js
```
**Check:** Both can send notifications to the same device? ✅

---

## Key Points

### Shared Database (Important!)

Both servers use the **same** device token collection:
```
Database: edulearn-social
Collection: devicetokens
```

**This means:**
- Device registers via Quiz Server
- Token is stored in shared database
- Microservice reads same tokens
- Both servers can send to same device ✅

### Test User UUID

All tests use the same test user:
```
e05bb02d-d4d4-468d-8436-6ba765ff8e99
```

**To use a different user:**
Edit the `TEST_USER_UUID` constant in the test file and change it to the UUID of a user who registered a device.

### Database Connection

The microservice tests use:
```javascript
import { connectDatabase } from '../src/config/database.js';
await connectDatabase();
```

This connects to the database specified in your `.env`:
```env
MONGODB_URI=mongodb+srv://adilyassar9898:adilyassar98A@cluster0.9tblz0r.mongodb.net/edulearn-social
```

---

## Troubleshooting

### Issue: "No device tokens found"

**Solution:** Register a device from Quiz Server first
```bash
# On Quiz Server
node tests/test-notifications.js

# Then on Microservice
node tests/test-notification-send.js
```

### Issue: "Firebase not initialized"

**Check:** 
- Is `FIREBASE_SERVICE_ACCOUNT_JSON` set in `.env`?
- Does the Firebase service account file exist?
- Are Firebase credentials valid?

### Issue: "Invalid registration token"

**Means:** Device token expired or Firebase doesn't recognize it

**Solution:**
- Re-register the device on the app
- Restart the mobile app
- Reinstall the app if persistent

### Issue: "Notification doesn't appear on device"

**Check:**
- Is the app installed and running (at least in background)?
- Did you grant notification permissions?
- Check device notification settings for your app

---

## Next: Proper Implementation Triggers

Once testing confirms both servers can send notifications, we'll integrate with actual events:

### Quiz Server Triggers
```javascript
// When user logs in
await firebaseNotificationService.sendAuthNotification(userUUID, ...)

// When quiz assigned
await firebaseNotificationService.sendQuizAssignedNotification(userUUIDs, ...)

// When grades released
await firebaseNotificationService.sendGradeReleasedNotification(userUUID, ...)

// When achievement unlocked
await firebaseNotificationService.sendAchievementNotification(userUUID, ...)
```

### Microservice Triggers
```javascript
// When friend request sent
await firebaseNotificationService.sendToUser(userUUID, 'friend_request', ...)

// When message received
await firebaseNotificationService.sendToUser(userUUID, 'message_received', ...)

// When post liked
await firebaseNotificationService.sendToUser(userUUID, 'post_liked', ...)

// When mentioned
await firebaseNotificationService.sendToUser(userUUID, 'mention', ...)
```

---

## Quick Test Commands

```bash
# Microservice - Debug
node tests/debug-notification-delivery.js

# Microservice - Send
node tests/test-notification-send.js

# Quiz Server - Debug (from Quiz Server dir)
node tests/test-firebase.js

# Quiz Server - Send (from Quiz Server dir)
node tests/test-notifications.js
```

---

## Success Checklist

- [ ] Debug script shows "✅ Connected"
- [ ] Debug script finds device tokens
- [ ] Debug script shows "✅ Firebase ready"
- [ ] Send script shows "✅ Successful: 1/1"
- [ ] You see notification on device after 1-2 seconds
- [ ] Notification is from "Microservice"
- [ ] Database record created in microservice DB
- [ ] Both Quiz Server and Microservice can send to same device

---

## Ready for Implementation!

Once all tests pass ✅, you're ready to:

1. Add notification triggers in services
2. Send real notifications on actual events
3. Deploy to production
4. Monitor notification delivery

**Estimated time to full implementation:** 2-3 hours
