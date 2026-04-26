# Social Microservice API Documentation

**Base URL:** `http://localhost:4001/api/v1`

**Authentication:** All endpoints (except health check) require JWT Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Table of Contents

1. [Health Check](#1-health-check)
2. [Authentication](#2-authentication)
3. [User Management](#3-user-management)
4. [Friends](#4-friends)
5. [Chat & Messaging](#5-chat--messaging)
6. [Message Requests](#6-message-requests)
7. [Feed & Posts](#7-feed--posts)
8. [Groups](#8-groups)
9. [Media Upload](#9-media-upload)
10. [Notifications](#10-notifications)
11. [Socket Events](#11-socket-events)

---

## 1. Health Check

### GET `/health`
Check if the service is running.

**Authentication:** Not required

**Response:**
```json
{
  "status": "ok",
  "service": "social-microservice"
}
```

---

## 2. Authentication

### POST `/auth/initialize`
Initialize a user in the social microservice after they've authenticated with the Quiz Server.

**Authentication:** Required (Quiz Server JWT token)

**Request Body:** None required (user info extracted from JWT)

**Response:**
```json
{
  "status": "success",
  "data": {
    "quizServerUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
    "name": "Test User 1",
    "email": "testuser1@example.com",
    "avatar": null,
    "bio": null,
    "isOnline": false,
    "lastSeen": "2026-01-25T14:00:00.000Z",
    "createdAt": "2026-01-25T14:00:00.000Z"
  }
}
```

---

## 3. User Management

### GET `/users/me`
Get current user's profile.

**Response:**
```json
{
  "status": "success",
  "data": {
    "quizServerUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
    "name": "Test User 1",
    "email": "testuser1@example.com",
    "avatar": null,
    "bio": "Updated bio for testing",
    "isOnline": true,
    "lastSeen": "2026-01-25T14:00:00.000Z"
  }
}
```

### PATCH `/users/me`
Update current user's profile.

**Request Body:**
```json
{
  "bio": "Updated bio for testing",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "quizServerUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
    "name": "Test User 1",
    "bio": "Updated bio for testing",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

### GET `/users/search?q=<query>`
Search for users by name or email.

**Query Parameters:**
- `q` (required): Search query string

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "quizServerUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1",
      "name": "Test User 2",
      "email": "testuser2@example.com",
      "avatar": null,
      "bio": null
    }
  ]
}
```

### GET `/users/:uuid`
Get a specific user's profile by their UUID.

**Response:**
```json
{
  "status": "success",
  "data": {
    "quizServerUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1",
    "name": "Test User 2",
    "email": "testuser2@example.com",
    "avatar": null,
    "bio": null,
    "isOnline": false
  }
}
```

---

## 4. Friends

### POST `/friends/request`
Send a friend request to another user.

**Request Body:**
```json
{
  "recipientUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1",
  "message": "Hi! Let's be friends!"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "69762a3c74ff3d7acb304af1",
    "requesterUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
    "recipientUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1",
    "status": "pending",
    "createdAt": "2026-01-25T14:00:00.000Z"
  }
}
```

### GET `/friends/requests`
Get all pending friend requests received by the current user.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "69762a3c74ff3d7acb304af1",
      "requesterUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
      "recipientUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1",
      "status": "pending",
      "createdAt": "2026-01-25T14:00:00.000Z",
      "requester": {
        "name": "Test User 1",
        "avatar": null
      }
    }
  ]
}
```

### POST `/friends/accept`
Accept a friend request.

**Request Body:**
```json
{
  "requesterUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "69762a3c74ff3d7acb304af2",
    "requesterUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
    "recipientUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1",
    "status": "accepted",
    "acceptedAt": "2026-01-25T14:01:00.000Z"
  }
}
```

### POST `/friends/reject`
Reject a friend request.

**Request Body:**
```json
{
  "requesterUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Friend request rejected"
}
```

### GET `/friends`
Get all friends of the current user.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "quizServerUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1",
      "name": "Test User 2",
      "avatar": null,
      "isOnline": false,
      "lastSeen": "2026-01-25T13:00:00.000Z"
    }
  ]
}
```

### GET `/friends/suggestions`
Get friend suggestions based on mutual friends and courses.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "quizServerUUID": "user-uuid-3",
      "name": "Suggested User",
      "avatar": null,
      "mutualFriends": 2
    }
  ]
}
```

### POST `/friends/block/:uuid`
Block a user.

**Response:**
```json
{
  "status": "success",
  "message": "User blocked"
}
```

### DELETE `/friends/unblock/:uuid`
Unblock a user.

**Response:**
```json
{
  "status": "success",
  "message": "User unblocked"
}
```

---

## 5. Chat & Messaging

### POST `/chat/conversations`
Create a new direct conversation with another user.

**Request Body:**
```json
{
  "recipientUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "69762a3c74ff3d7acb304af3",
    "type": "direct",
    "participantUUIDs": [
      "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
      "8bafd461-6db4-4b9b-aa64-7b3bad8134c1"
    ],
    "initiatorUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
    "unreadCounts": [
      { "userUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e", "count": 0 },
      { "userUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1", "count": 0 }
    ],
    "createdAt": "2026-01-25T14:00:00.000Z"
  }
}
```

### GET `/chat/conversations`
Get all conversations for the current user.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "69762a3c74ff3d7acb304af3",
      "type": "direct",
      "participantUUIDs": [
        "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
        "8bafd461-6db4-4b9b-aa64-7b3bad8134c1"
      ],
      "lastMessage": {
        "messageId": "69762a3d74ff3d7acb304b00",
        "senderUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
        "preview": "Hello! This is a test message.",
        "timestamp": "2026-01-25T14:01:00.000Z",
        "type": "text"
      },
      "unreadCounts": [
        { "userUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e", "count": 0 },
        { "userUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1", "count": 1 }
      ],
      "otherUser": {
        "name": "Test User 2",
        "avatar": null,
        "isOnline": false,
        "lastSeen": "2026-01-25T13:00:00.000Z"
      },
      "createdAt": "2026-01-25T14:00:00.000Z"
    }
  ]
}
```

### GET `/chat/conversations/:conversationId/messages?page=1&limit=50`
Get messages in a conversation.

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Messages per page

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "69762a3d74ff3d7acb304b00",
      "conversationId": "69762a3c74ff3d7acb304af3",
      "senderUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
      "type": "text",
      "content": {
        "text": "Hello! This is a test message."
      },
      "reactions": [],
      "isEdited": false,
      "isDeleted": false,
      "createdAt": "2026-01-25T14:01:00.000Z"
    }
  ]
}
```

### POST `/chat/conversations/:conversationId/messages`
Send a message in a conversation.

**Request Body:**
```json
{
  "content": {
    "text": "Hello! This is a test message."
  },
  "type": "text"
}
```

**For media messages:**
```json
{
  "content": {
    "text": "Check out this image!",
    "media": [
      {
        "mediaId": "file-id-from-upload",
        "url": "https://drive.google.com/...",
        "type": "image",
        "thumbnail": "thumbnail-id",
        "thumbnailUrl": "https://drive.google.com/..."
      }
    ]
  },
  "type": "image"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "69762a3d74ff3d7acb304b00",
    "conversationId": "69762a3c74ff3d7acb304af3",
    "senderUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
    "type": "text",
    "content": {
      "text": "Hello! This is a test message."
    },
    "reactions": [],
    "createdAt": "2026-01-25T14:01:00.000Z"
  }
}
```

### POST `/chat/messages/:id/react`
Add a reaction to a message.

**Request Body:**
```json
{
  "emoji": "👍"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "69762a3d74ff3d7acb304b00",
    "reactions": [
      {
        "userUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1",
        "emoji": "👍",
        "timestamp": "2026-01-25T14:02:00.000Z"
      }
    ]
  }
}
```

### PUT `/chat/conversations/:conversationId/read`
Mark a conversation as read.

**Response:**
```json
{
  "status": "success",
  "data": {
    "status": "read"
  }
}
```

### PUT `/chat/conversations/:conversationId/mute`
Mute or unmute a conversation.

**Request Body:**
```json
{
  "muted": true
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "status": "muted"
  }
}
```

---

## 6. Message Requests

### POST `/message-requests`
Send a message request to a non-friend user.

**Request Body:**
```json
{
  "recipientUUID": "user-uuid",
  "message": {
    "text": "Hi! Can we chat?"
  },
  "type": "text"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "69762a3e74ff3d7acb304b18",
    "senderUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
    "recipientUUID": "user-uuid",
    "message": {
      "text": "Hi! Can we chat?"
    },
    "type": "text",
    "status": "pending",
    "createdAt": "2026-01-25T14:03:00.000Z"
  }
}
```

### GET `/message-requests`
Get all pending message requests.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "69762a3e74ff3d7acb304b18",
      "senderUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
      "recipientUUID": "user-uuid",
      "message": {
        "text": "Hi! Can we chat?"
      },
      "status": "pending",
      "sender": {
        "name": "Test User 1",
        "avatar": null
      },
      "createdAt": "2026-01-25T14:03:00.000Z"
    }
  ]
}
```

### PUT `/message-requests/:id/accept`
Accept a message request.

**Response:**
```json
{
  "status": "success",
  "data": {
    "status": "accepted",
    "conversationId": "69762a3e74ff3d7acb304b19"
  }
}
```

### PUT `/message-requests/:id/reject`
Reject a message request.

**Response:**
```json
{
  "status": "success",
  "data": {
    "status": "rejected"
  }
}
```

---

## 7. Feed & Posts

### POST `/feed`
Create a new post.

**Request Body (Text Post):**
```json
{
  "content": {
    "text": "This is my first test post! #testing"
  },
  "visibility": "public",
  "type": "general"
}
```

**Request Body (Post with Media):**
```json
{
  "content": {
    "text": "Check out this photo!",
    "media": [
      {
        "mediaId": "file-id",
        "url": "https://drive.google.com/...",
        "type": "image",
        "thumbnail": "thumbnail-id",
        "thumbnailUrl": "https://drive.google.com/..."
      }
    ]
  },
  "visibility": "friends",
  "type": "general"
}
```

**Request Body (Progress Post):**
```json
{
  "content": {
    "text": "Just completed the course!",
    "progress": {
      "type": "course_completed",
      "courseId": "course-123",
      "courseName": "JavaScript Fundamentals",
      "score": 95,
      "grade": "A+"
    }
  },
  "visibility": "public",
  "type": "progress"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "69762a3f74ff3d7acb304b26",
    "authorUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
    "type": "general",
    "content": {
      "text": "This is my first test post! #testing"
    },
    "visibility": "public",
    "stats": {
      "likes": 0,
      "comments": 0,
      "shares": 0,
      "views": 0
    },
    "hashtags": ["testing"],
    "createdAt": "2026-01-25T14:04:00.000Z"
  }
}
```

### GET `/feed?page=1`
Get the user's feed (posts from friends and self).

**Query Parameters:**
- `page` (optional, default: 1): Page number

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "69762a3f74ff3d7acb304b26",
      "authorUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
      "type": "general",
      "content": {
        "text": "This is my first test post! #testing"
      },
      "visibility": "public",
      "stats": {
        "likes": 1,
        "comments": 1,
        "shares": 0,
        "views": 5
      },
      "author": {
        "name": "Test User 1",
        "avatar": null,
        "quizServerUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e"
      },
      "isLiked": false,
      "createdAt": "2026-01-25T14:04:00.000Z"
    }
  ]
}
```

### GET `/feed/:id`
Get a specific post by ID.

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "69762a3f74ff3d7acb304b26",
    "authorUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
    "content": {
      "text": "This is my first test post! #testing"
    },
    "visibility": "public",
    "stats": {
      "likes": 1,
      "comments": 1
    },
    "createdAt": "2026-01-25T14:04:00.000Z"
  }
}
```

### PUT `/feed/:id`
Update a post (only author can update).

**Request Body:**
```json
{
  "content": {
    "text": "Updated test post content!"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "69762a3f74ff3d7acb304b26",
    "content": {
      "text": "Updated test post content!"
    },
    "isEdited": true,
    "editedAt": "2026-01-25T14:05:00.000Z"
  }
}
```

### DELETE `/feed/:id`
Delete a post (only author can delete).

**Response:**
```json
{
  "status": "success",
  "message": "Post deleted"
}
```

### POST `/feed/:id/like`
Like or unlike a post (toggle).

**Response:**
```json
{
  "status": "success",
  "data": {
    "isLiked": true
  }
}
```

### GET `/feed/:id/comments?page=1`
Get comments on a post.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "69762a4074ff3d7acb304b38",
      "postId": "69762a3f74ff3d7acb304b26",
      "authorUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1",
      "content": {
        "text": "Great post! This is a test comment."
      },
      "stats": {
        "likes": 1
      },
      "author": {
        "name": "Test User 2",
        "avatar": null,
        "quizServerUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1"
      },
      "createdAt": "2026-01-25T14:06:00.000Z"
    }
  ]
}
```

### POST `/feed/:id/comments`
Add a comment to a post.

**Request Body:**
```json
{
  "content": "Great post! This is a test comment."
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "69762a4074ff3d7acb304b38",
    "postId": "69762a3f74ff3d7acb304b26",
    "authorUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1",
    "content": {
      "text": "Great post! This is a test comment."
    },
    "stats": {
      "likes": 0
    },
    "createdAt": "2026-01-25T14:06:00.000Z"
  }
}
```

### DELETE `/feed/comments/:commentId`
Delete a comment (only author can delete).

**Response:**
```json
{
  "status": "success",
  "message": "Comment deleted"
}
```

### POST `/feed/comments/:commentId/like`
Like or unlike a comment (toggle).

**Response:**
```json
{
  "status": "success",
  "data": {
    "isLiked": true
  }
}
```

---

## 8. Groups

### POST `/groups`
Create a new group.

**Request Body:**
```json
{
  "name": "Test Study Group",
  "description": "A group for testing purposes",
  "settings": {
    "maxMembers": 50,
    "joinApproval": true,
    "allowMemberInvites": true,
    "onlyAdminsCanPost": false
  }
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "69762a4274ff3d7acb304b4d",
    "name": "Test Study Group",
    "description": "A group for testing purposes",
    "creatorUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
    "adminUUIDs": ["fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e"],
    "settings": {
      "maxMembers": 50,
      "joinApproval": true,
      "allowMemberInvites": true,
      "onlyAdminsCanPost": false
    },
    "stats": {
      "members": 1,
      "posts": 0
    },
    "createdAt": "2026-01-25T14:07:00.000Z"
  }
}
```

### GET `/groups`
Get all groups the user is a member of.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "69762a4274ff3d7acb304b4d",
      "name": "Test Study Group",
      "description": "A group for testing purposes",
      "stats": {
        "members": 2,
        "posts": 5
      },
      "createdAt": "2026-01-25T14:07:00.000Z"
    }
  ]
}
```

### GET `/groups/:id`
Get details of a specific group.

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "69762a4274ff3d7acb304b4d",
    "name": "Test Study Group",
    "description": "A group for testing purposes",
    "creatorUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
    "adminUUIDs": ["fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e"],
    "settings": {
      "maxMembers": 50,
      "joinApproval": true
    },
    "stats": {
      "members": 2,
      "posts": 0
    },
    "createdAt": "2026-01-25T14:07:00.000Z"
  }
}
```

### POST `/groups/:id/members`
Add a member to a group.

**Request Body:**
```json
{
  "userUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Member added successfully"
  }
}
```

---

## 9. Media Upload

### POST `/media/upload`
Upload a file to Google Drive.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `file`

**Example using FormData:**
```javascript
const formData = new FormData();
formData.append('file', fileBlob, 'filename.jpg');

fetch('http://localhost:4001/api/v1/media/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "fileId": "1a2b3c4d5e6f7g8h9i0j",
    "url": "https://drive.google.com/uc?id=1a2b3c4d5e6f7g8h9i0j",
    "fileName": "filename.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 102400,
    "thumbnail": "1x2y3z4w5v6u7t8s9r0q",
    "thumbnailUrl": "https://drive.google.com/uc?id=1x2y3z4w5v6u7t8s9r0q"
  }
}
```

### GET `/media/:fileId`
Get file metadata.

**Response:**
```json
{
  "status": "success",
  "data": {
    "fileId": "1a2b3c4d5e6f7g8h9i0j",
    "url": "https://drive.google.com/uc?id=1a2b3c4d5e6f7g8h9i0j",
    "fileName": "filename.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 102400
  }
}
```

### DELETE `/media/:fileId`
Delete a file from Google Drive.

**Response:**
```json
{
  "status": "success",
  "message": "File deleted successfully"
}
```

---

## 10. Notifications

### GET `/notifications`
Get all notifications for the current user.

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "notification-id",
      "recipientUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
      "type": "friend_request",
      "actorUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1",
      "content": {
        "message": "Test User 2 sent you a friend request"
      },
      "isRead": false,
      "createdAt": "2026-01-25T14:00:00.000Z"
    },
    {
      "_id": "notification-id-2",
      "recipientUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
      "type": "post_like",
      "actorUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1",
      "content": {
        "message": "Test User 2 liked your post",
        "postId": "69762a3f74ff3d7acb304b26"
      },
      "isRead": false,
      "createdAt": "2026-01-25T14:05:00.000Z"
    }
  ]
}
```

### PUT `/notifications/read/:notificationId?`
Mark notification(s) as read.

**Parameters:**
- `notificationId` (optional): If provided, marks only that notification as read. If omitted, marks all notifications as read.

**Response:**
```json
{
  "status": "success",
  "data": {
    "status": "read"
  }
}
```

---

## 11. Socket Events

The microservice uses Socket.IO for real-time communication. Connect to the WebSocket server at `http://localhost:4001`.

### Connection

**Client-side connection:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4001', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events to Listen For (Client)

#### `message:new`
Emitted when a new message is sent in a conversation.

**Payload:**
```json
{
  "_id": "69762a3d74ff3d7acb304b00",
  "conversationId": "69762a3c74ff3d7acb304af3",
  "senderUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
  "type": "text",
  "content": {
    "text": "Hello! This is a test message."
  },
  "createdAt": "2026-01-25T14:01:00.000Z"
}
```

**Usage:**
```javascript
socket.on('message:new', (message) => {
  console.log('New message:', message);
  // Update UI with new message
});
```

#### `conversation:update`
Emitted when a conversation is updated (new message, muted, etc.).

**Payload:**
```json
{
  "_id": "69762a3c74ff3d7acb304af3",
  "lastMessage": {
    "messageId": "69762a3d74ff3d7acb304b00",
    "senderUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
    "preview": "Hello! This is a test message.",
    "timestamp": "2026-01-25T14:01:00.000Z",
    "type": "text"
  },
  "unreadCounts": [
    { "userUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e", "count": 0 },
    { "userUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1", "count": 1 }
  ]
}
```

**Usage:**
```javascript
socket.on('conversation:update', (conversation) => {
  console.log('Conversation updated:', conversation);
  // Update conversation list
});
```

#### `message:reaction`
Emitted when someone reacts to a message.

**Payload:**
```json
{
  "messageId": "69762a3d74ff3d7acb304b00",
  "userUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1",
  "emoji": "👍"
}
```

**Usage:**
```javascript
socket.on('message:reaction', (data) => {
  console.log('Message reaction:', data);
  // Update message with new reaction
});
```

#### `notification:new`
Emitted when a new notification is created for the user.

**Payload:**
```json
{
  "_id": "notification-id",
  "recipientUUID": "fa3e7f1a-8f86-4e31-88cd-bcf065b6b08e",
  "type": "friend_request",
  "actorUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1",
  "content": {
    "message": "Test User 2 sent you a friend request"
  },
  "isRead": false,
  "createdAt": "2026-01-25T14:00:00.000Z"
}
```

**Usage:**
```javascript
socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
  // Show notification to user
});
```

#### `user:online`
Emitted when a friend comes online.

**Payload:**
```json
{
  "userUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1",
  "isOnline": true
}
```

**Usage:**
```javascript
socket.on('user:online', (data) => {
  console.log('User online:', data);
  // Update user status in UI
});
```

#### `user:offline`
Emitted when a friend goes offline.

**Payload:**
```json
{
  "userUUID": "8bafd461-6db4-4b9b-aa64-7b3bad8134c1",
  "isOnline": false,
  "lastSeen": "2026-01-25T14:10:00.000Z"
}
```

**Usage:**
```javascript
socket.on('user:offline', (data) => {
  console.log('User offline:', data);
  // Update user status in UI
});
```

### Events to Emit (Client)

#### `join:conversation`
Join a conversation room to receive real-time updates.

**Emit:**
```javascript
socket.emit('join:conversation', {
  conversationId: '69762a3c74ff3d7acb304af3'
});
```

#### `leave:conversation`
Leave a conversation room.

**Emit:**
```javascript
socket.emit('leave:conversation', {
  conversationId: '69762a3c74ff3d7acb304af3'
});
```

#### `typing:start`
Notify others that you're typing in a conversation.

**Emit:**
```javascript
socket.emit('typing:start', {
  conversationId: '69762a3c74ff3d7acb304af3'
});
```

**Others will receive:**
```javascript
socket.on('typing:start', (data) => {
  console.log('User typing:', data);
  // data = { conversationId, userUUID, userName }
});
```

#### `typing:stop`
Notify others that you stopped typing.

**Emit:**
```javascript
socket.emit('typing:stop', {
  conversationId: '69762a3c74ff3d7acb304af3'
});
```

**Others will receive:**
```javascript
socket.on('typing:stop', (data) => {
  console.log('User stopped typing:', data);
  // data = { conversationId, userUUID }
});
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "status": "error",
  "message": "Error description here"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation error, missing fields)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (access denied)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Rate Limiting

The API implements rate limiting:
- **API Endpoints:** 100 requests per minute
- **Messages:** 60 messages per minute

When rate limit is exceeded:
```json
{
  "status": "error",
  "message": "Too many requests, please try again later"
}
```

---

## Integration Notes

### 1. Authentication Flow
1. User authenticates with Quiz Server
2. Receive JWT access token from Quiz Server
3. Call `/auth/initialize` with the Quiz Server token
4. Use the same token for all subsequent requests to the Social Microservice

### 2. Real-time Updates
- Always connect to Socket.IO when user logs in
- Join conversation rooms when viewing a conversation
- Leave rooms when navigating away to reduce server load

### 3. Media Handling
- Upload files first using `/media/upload`
- Use the returned `fileId` and `url` in posts/messages
- Thumbnails are automatically generated for images

### 4. Pagination
- Most list endpoints support pagination
- Default page size is usually 20-50 items
- Always check for `hasMore` or similar fields in responses

### 5. Offline Support
- Cache conversations and messages locally
- Queue messages when offline
- Sync when connection is restored

---

## Example Integration Code

### React/React Native Example

```javascript
import axios from 'axios';
import io from 'socket.io-client';

const API_BASE_URL = 'http://localhost:4001/api/v1';
let socket = null;

// Create axios instance with auth
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Initialize user in social microservice
export const initializeSocialUser = async () => {
  const response = await api.post('/auth/initialize');
  return response.data;
};

// Connect to socket
export const connectSocket = (token) => {
  socket = io('http://localhost:4001', {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('message:new', (message) => {
    // Handle new message
    console.log('New message:', message);
  });

  socket.on('notification:new', (notification) => {
    // Handle new notification
    console.log('New notification:', notification);
  });

  return socket;
};

// Send a message
export const sendMessage = async (conversationId, content) => {
  const response = await api.post(
    `/chat/conversations/${conversationId}/messages`,
    {
      content: { text: content },
      type: 'text'
    }
  );
  return response.data;
};

// Get feed
export const getFeed = async (page = 1) => {
  const response = await api.get(`/feed?page=${page}`);
  return response.data;
};

// Create post
export const createPost = async (text, visibility = 'public') => {
  const response = await api.post('/feed', {
    content: { text },
    visibility,
    type: 'general'
  });
  return response.data;
};

// Upload file
export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/media/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};
```

---

**Version:** 1.0.0  
**Last Updated:** January 25, 2026  
**Support:** For issues or questions, contact the development team.
