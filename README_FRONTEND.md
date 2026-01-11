# 📱 Social Microservice - Full Frontend Integration Guide
**Version:** 1.0.0 | **Author:** Antigravity AI

This guide is for the React Native / Frontend team. It details every endpoint, socket event, and implementation pattern required to build the social features (Feed, Chat, Friends, Media) for the EduLearn platform.

---

## 🏗️ 1. Architecture Overview
This server is a **Social Orchestration Layer**. It handles real-time communication and social data while staying synced with the **Quiz Server**.

- **Lazy Sync:** When a user connects to this server with a valid Quiz Server JWT, their social profile is automatically created if it doesn't exist.
- **Media Engine:** All files are streamed through this server to **Google Drive**. We store Drive IDs and Direct URLs in our MongoDB.
- **Event Driven:** Likes, comments, and messages trigger background jobs for notifications and moderation.

---

## ⚡ 2. Core Connection Setup

### Axios Configuration (HTTP)
```javascript
import axios from 'axios';

const socialClient = axios.create({
  baseURL: 'http://YOUR_SERVER_IP:4005/api/v1',
  timeout: 10000,
});

// Attach JWT from Quiz Server
socialClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken(); // Get your JWT
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Socket.IO Setup (Real-time)
```javascript
import { io } from "socket.io-client";

const socket = io("http://YOUR_SERVER_IP:4005", {
  auth: { token: "QUIZ_SERVER_ACCESS_TOKEN" },
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("Connected to Social Microservice");
});
```

---

## 🎞️ 3. Media Upload (Google Drive)
**Endpoint:** `POST /media/upload`

### Implementation Detail:
React Native `FormData` is strict. You **must** provide `uri`, `name`, and `type`.

```javascript
const uploadToSocial = async (imageAsset) => {
  const data = new FormData();
  data.append('file', {
    uri: Platform.OS === 'android' ? imageAsset.uri : imageAsset.uri.replace('file://', ''),
    name: imageAsset.fileName || 'upload.jpg',
    type: imageAsset.type || 'image/jpeg',
  });

  const res = await socialClient.post('/media/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return res.data.data; // { id, url, mimeType }
};
```
> **URL Format:** For videos, images, and audio, use the `url` field from the response. It is formatted as `https://drive.google.com/uc?export=view&id=...` which works directly in `<Image>` and `react-native-video`.

---

## 📮 4. The Social Feed
### Fetching the Feed
**Endpoint:** `GET /feed?page=1&limit=20`
Includes posts from the user and their friends.

### Creating a Post
When creating a post with media, wait for the upload to finish first, then send the `id` and `url`.

```javascript
const createPost = async (text, mediaData) => {
  await socialClient.post('/feed', {
    type: 'general',
    visibility: 'public',
    content: {
      text: text,
      media: [{
        mediaId: mediaData.id,
        url: mediaData.url, // Full streaming URL
        type: mediaData.mimeType.startsWith('video') ? 'video' : 'image'
      }]
    }
  });
};
```

### Real-time Feed Updates
Listen for the `feed:update` event to refresh the list without a manual pull-to-refresh.
```javascript
socket.on('feed:update', (newPost) => {
  // Add newPost to the top of your state list
});
```

---

## 💬 5. Advanced Chat System
Our chat uses **Room Joining**. Before sending/receiving messages in a chat, you **must** join the conversation room.

### Joining a Conversation
```javascript
// When entering a Chat screen
socket.emit('conversation:join', { conversationId: "123..." });

// When leaving the screen
socket.emit('conversation:leave', { conversationId: "123..." });
```

### Sending Messages (Optimistic UI)
```javascript
const sendMessage = (text, convId) => {
  const tempId = Date.now().toString();
  
  // 1. Add to local UI state immediately with "sending" status
  
  // 2. Emit to server
  socket.emit('message:send', {
    conversationId: convId,
    content: { text },
    type: 'text',
    tempId: tempId // Send tempId to track response
  });
};

// 3. Listen for server acknowledgement
socket.on('message:sent', ({ tempId, message }) => {
  // Find message with tempId and update its status to 'sent' + update real ID
});
```

### Typing Indicators
```javascript
// On TextInput change
socket.emit('typing:start', { conversationId });

// On stop typing (use a debounce)
socket.emit('typing:stop', { conversationId });
```

---

## 🟢 6. Presence & Notifications
To show who's online, your app should update its status every few minutes or on app open.

### Update My Status
```javascript
socket.emit('presence:update', { status: 'online' });
```

### Listen for Global Status Changes
```javascript
socket.on('presence:status', ({ userUUID, status, lastSeen }) => {
  // Update your contact list UI online circles
});
```

### Global Notifications
The server sends notifications (Likes, Comments, Friend Requests) to your personal room.
```javascript
socket.on('notification:new', (notif) => {
  // Show a local push notification or update the bell icon badge
  console.log(`Notification: ${notif.title} - ${notif.message}`);
});
```

---

## � 7. Integration Matrix (Cheat Sheet)

| Function | API Endpoint / Socket Event | Method/Room |
| :--- | :--- | :--- |
| **Get Conversations** | `GET /chat/conversations` | REST |
| **Get Messages** | `GET /chat/conversations/:id/messages` | REST (Pagination) |
| **React to Message** | `POST /chat/messages/:id/react` | REST |
| **Send Friend Request**| `POST /friends/request` | REST |
| **Mute Chat** | `PUT /chat/conversations/:id/mute` | REST |
| **Mark as Read** | `PUT /chat/conversations/:id/read` | REST |

---

## � 8. Troubleshooting
- **CORS Errors:** Ensure your developer machine's IP is in the `ALLOWED_ORIGINS` in `.env`.
- **401 Invalid Token:** Ensure the JWT hasn't expired on the Quiz Server.
- **Media 500 Error:** Check if the Google Drive Refresh Token on the server has been updated today.

---
**Social Microservice Team** 🚀
