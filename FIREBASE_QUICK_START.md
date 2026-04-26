# Firebase Setup - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Create Firebase Project
```
https://console.firebase.google.com/
↓
Click "Create Project"
↓
Name: "edulearn-notifications"
↓
Create
```

### 2. Download Service Account Key
```
Firebase Console
↓
⚙️ Settings → Service Accounts tab
↓
"Generate New Private Key"
↓
JSON file downloads
```

### 3. Add to Microservice

**Option A: Easy (Recommended for Development)**
```bash
# 1. Save the downloaded JSON to your microservice
mkdir -p src/config
# Copy your firebase JSON file to: src/config/firebase-service-account.json

# 2. Update .env
FIREBASE_SERVICE_ACCOUNT_JSON=./config/firebase-service-account.json
MICROSERVICE_INTERNAL_TOKEN=change-this-to-something-random
```

**Option B: Environment Variable (Recommended for Production)**
```bash
# 1. Copy the entire JSON content from your downloaded file

# 2. In .env (keep on one line):
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"xxx",...}'

# 2. Or on multiple lines (use triple quotes on Windows PowerShell):
$json = @'
{
  "type": "service_account",
  ...
}
'@
# Then set the env var
```

### 4. Get VAPID Key (for Web Push)

```
Firebase Console
↓
Cloud Messaging tab
↓
Web configuration section
↓
"Generate Key Pair" or copy existing public key
↓
Add to .env:
FIREBASE_VAPID_PUBLIC_KEY=your_key_here
```

### 5. Install Dependencies
```bash
npm install firebase-admin
```

### 6. Test the Setup
```bash
# Start the server
npm run dev

# You should see:
# ✅ Firebase initialized successfully
# ✅ Social Microservice is RUNNING
```

---

## 📋 Step by Step with Screenshots

### Step 1: Go to Firebase Console
Open [https://console.firebase.google.com/](https://console.firebase.google.com/)

### Step 2: Create New Project
1. Click **"Create a new project"** button
2. Enter project name: `edulearn-notifications`
3. Don't need Google Analytics → Click **Create project**

### Step 3: Wait for Project Creation
This takes 1-2 minutes. You'll see a loading screen.

### Step 4: Get Service Account
1. Click the **⚙️ gear icon** (Settings) in top-left
2. Go to **"Service Accounts"** tab
3. Click **"Generate New Private Key"** button
4. A JSON file downloads automatically
5. Don't share this file! It's your credentials.

### Step 5: Save to Your Project
1. Open the downloaded `xxxx-firebase-adminsdk-xxxx.json`
2. Copy entire file (Ctrl+A, Ctrl+C)
3. Create new file in: `src/config/firebase-service-account.json`
4. Paste the JSON (Ctrl+V)

### Step 6: Update Your .env

Copy this to your `.env` file:

```env
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_JSON=./config/firebase-service-account.json

# Internal API Security Token (change this to something random!)
MICROSERVICE_INTERNAL_TOKEN=super-secret-token-change-this-to-32-chars-minimum
```

### Step 7: Install Firebase
```bash
npm install firebase-admin
```

### Step 8: Start Server and Verify

```bash
npm run dev
```

Look for this in the console:
```
Firebase initialized successfully
✅ Social Microservice is RUNNING
```

Congratulations! Firebase is now set up! 🎉

---

## ✅ Verification Checklist

- [ ] Created Firebase project
- [ ] Downloaded service account JSON
- [ ] Saved JSON to `src/config/firebase-service-account.json`
- [ ] Updated `.env` with `FIREBASE_SERVICE_ACCOUNT_JSON`
- [ ] Set `MICROSERVICE_INTERNAL_TOKEN` in `.env`
- [ ] Ran `npm install firebase-admin`
- [ ] Server starts without Firebase errors
- [ ] File `src/config/firebase-service-account.json` is in `.gitignore`

---

## 🔧 Troubleshooting

### "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### "Invalid Firebase credentials"
- Check JSON file is valid (copy entire file with no missing parts)
- Check `FIREBASE_SERVICE_ACCOUNT_JSON` points to correct file
- Try downloading the key again from Firebase console

### "Firebase messaging not initialized"
- Verify `.env` has `FIREBASE_SERVICE_ACCOUNT_JSON` set
- Check file path is correct and file exists
- Restart the server after adding env var

### "ENOENT: no such file or directory"
- Make sure `src/config/firebase-service-account.json` exists
- Or use full path in `.env`

---

## 🔐 Security Notes

1. **Never commit firebase-service-account.json** ← Already in .gitignore
2. **Use strong internal token** → Change `MICROSERVICE_INTERNAL_TOKEN`
3. **Don't share service account JSON** → It's like a password to your Firebase
4. **In production** → Use environment variables or CI/CD secrets manager

---

## 📚 What's Next

After setup:
1. [Enable device token registration](./FIREBASE_SETUP_GUIDE.md)
2. [Send your first notification](./FIREBASE_SETUP_GUIDE.md#usage-examples)
3. [Frontend implementation](./FIREBASE_SETUP_GUIDE.md#frontend-implementation)
