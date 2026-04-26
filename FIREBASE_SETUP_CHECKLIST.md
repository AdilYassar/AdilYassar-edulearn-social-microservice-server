# Firebase Setup Checklist

## Firebase Console Setup

- [ ] Create Firebase project (https://console.firebase.google.com/)
- [ ] Project Name: `edulearn-notifications`
- [ ] Enable Cloud Messaging
- [ ] Get Service Account Key

## Service Account Credentials

Method 1 (Simpler):
```bash
# 1. Download firebase-service-account.json from Firebase Console
# 2. Save to: src/config/firebase-service-account.json
# 3. Add to .gitignore:
echo "src/config/firebase-service-account.json" >> .gitignore
```

Method 2 (One-liner in .env):
```env
# Copy entire JSON on one line
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

## Environment Variables Setup

Create/Update `.env`:

```env
# Firebase
FIREBASE_SERVICE_ACCOUNT_JSON=./config/firebase-service-account.json
# OR use one-liner:
# FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"xxxxx",...}'

FIREBASE_VAPID_PUBLIC_KEY=your_vapid_key_from_firebase_console

# Internal Communication
MICROSERVICE_INTERNAL_TOKEN=change-this-to-something-secret-32-chars-minimum

# Also ensure you have:
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
JWT_SECRET=your-jwt-secret
```

## Package Installation

```bash
# Install firebase-admin if not already installed
npm install firebase-admin

# Verify installation
npm list firebase-admin
```

## Verify Setup

Run these in Node REPL:

```javascript
// Test 1: Load config
const config = require('./src/config');
console.log('Config loaded:', config);

// Test 2: Initialize Firebase
const { initFirebase, getFirebaseMessaging } = require('./src/config/firebase');
initFirebase();
const messaging = getFirebaseMessaging();
console.log('Firebase initialized:', messaging ? 'YES' : 'NO');

// Test 3: Firebase is ready
console.log('Firebase ready for notifications!');
```

## Expected File Structure

```
src/config/
├── firebase.js                          (CREATED)
├── firebase-service-account.json        (DOWNLOAD from Firebase Console)
└── ...

src/services/
├── firebase-notification.service.js     (CREATED)
└── ...

src/repositories/
├── device-token.repository.js           (CREATED)
└── ...
```

## Next: Test Connection

Once everything is set up, test the connection:

```bash
# Start the server
npm run dev

# In another terminal, test Firebase is working:
curl http://localhost:3001/api/v1/notifications/firebase/test \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response should show Firebase is connected
```

## Troubleshooting

**Error: Cannot find module 'firebase-admin'**
```bash
npm install firebase-admin
npm install
```

**Error: Invalid service account**
- Check JSON formatting (must be valid JSON)
- Check all required fields exist
- Verify environment variable name is correct

**Error: VAPID key missing**
- Not critical if you only need Android/iOS
- Only needed for web push

**Error: Firebase messaging not initialized**
- Check FIREBASE_SERVICE_ACCOUNT_JSON is set
- Check JSON is valid by running: `node -e "console.log(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))"`
- Check initFirebase() is called on server startup
