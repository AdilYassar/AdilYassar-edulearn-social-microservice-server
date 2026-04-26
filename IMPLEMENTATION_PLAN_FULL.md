# Microservice Notification Implementation Plan

## Overview

Once testing confirms notifications work, we'll integrate them with actual microservice events. This document outlines where and how to add notification triggers.

---

## Phase 1: Notification Triggers (Microservice)

### 1.1 Friend Request Notifications

**File:** `src/services/friends.service.js` or `src/api/v1/controllers/friends.controller.js`

**Trigger Event:** When friend request is sent

```javascript
// Current: Friend request sent
async sendFriendRequest(senderId, receiverId) {
    // ... existing code ...
    
    // ADD THIS:
    const friendRequest = await FriendRequest.create({
        senderId,
        receiverId,
        status: 'pending'
    });

    // NEW: Send notification
    await firebaseNotificationService.sendToUser(
        receiverId,  // The person receiving the request
        'friend_request',
        {
            title: 'New Friend Request',
            body: `${sender.name} sent you a friend request`,
            imageUrl: sender.profileImage || null
        },
        {
            senderId: senderId,
            senderName: sender.name,
            senderImage: sender.profileImage
        }
    );
    
    // ... return response ...
}
```

**Database Check:** Does `FriendRequest` model have sender name and profile image? ✅

---

### 1.2 Friend Request Accepted Notifications

**File:** `src/services/friends.service.js`

**Trigger Event:** When friend request is accepted

```javascript
// Current: Accept friend request
async acceptFriendRequest(requestId, userId) {
    // ... existing code ...
    
    const request = await FriendRequest.findById(requestId);
    
    // Update statuses, create friendship, etc...
    await Friendship.create({
        user1: request.senderId,
        user2: request.receiverId,
        status: 'accepted'
    });

    // NEW: Notify the sender (the person who made the original request)
    await firebaseNotificationService.sendToUser(
        request.senderId,
        'friend_accepted',
        {
            title: 'Friend Request Accepted',
            body: `${acceptingUser.name} accepted your friend request`,
            imageUrl: acceptingUser.profileImage || null
        },
        {
            acceptedByUserId: request.receiverId,
            acceptedByName: acceptingUser.name,
            acceptedByImage: acceptingUser.profileImage
        }
    );
    
    // ... return response ...
}
```

---

### 1.3 Message Received Notifications

**File:** `src/services/chat.service.js` or `src/api/v1/controllers/chat.controller.js`

**Trigger Event:** When new message is sent in a conversation

```javascript
// Current: Send message
async sendMessage(conversationId, senderId, content) {
    // ... existing code ...
    
    const message = await Message.create({
        conversationId,
        senderId,
        content,
        createdAt: new Date()
    });

    // NEW: Notify all other participants in conversation
    const conversation = await Conversation.findById(conversationId).populate('participants');
    
    const recipients = conversation.participants
        .filter(p => p._id.toString() !== senderId)
        .map(p => p._id);

    await firebaseNotificationService.sendToUsers(
        recipients,  // Send to all other participants
        'message_received',
        {
            title: `Message from ${sender.name}`,
            body: content.substring(0, 100),  // First 100 chars
            imageUrl: sender.profileImage || null
        },
        {
            conversationId: conversationId,
            senderId: senderId,
            senderName: sender.name,
            messagePreview: content.substring(0, 100)
        }
    );
    
    // ... return response ...
}
```

---

### 1.4 Post Liked Notifications

**File:** `src/services/feed.service.js` or `src/api/v1/controllers/feed.controller.js`

**Trigger Event:** When post is liked

```javascript
// Current: Like post
async likePost(postId, userId) {
    // ... existing code ...
    
    const like = await Like.create({
        postId,
        userId  // The person who liked it
    });

    // NEW: Notify post author (but not if they liked their own post)
    const post = await Post.findById(postId).populate('authorId');
    
    if (post.authorId._id.toString() !== userId) {  // Not their own like
        await firebaseNotificationService.sendToUser(
            post.authorId._id,
            'post_liked',
            {
                title: `${liker.name} liked your post`,
                body: post.content.substring(0, 100),
                imageUrl: liker.profileImage || null
            },
            {
                postId: postId,
                likedByUserId: userId,
                likedByName: liker.name,
                postPreview: post.content.substring(0, 100)
            }
        );
    }
    
    // ... return response ...
}
```

---

### 1.5 Post Commented Notifications

**File:** `src/services/feed.service.js`

**Trigger Event:** When comment is added to post

```javascript
// Current: Add comment
async addComment(postId, userId, commentContent) {
    // ... existing code ...
    
    const comment = await Comment.create({
        postId,
        authorId: userId,
        content: commentContent
    });

    // NEW: Notify post author (but not if they commented on their own post)
    const post = await Post.findById(postId).populate('authorId');
    const commenter = await User.findById(userId);
    
    if (post.authorId._id.toString() !== userId) {
        await firebaseNotificationService.sendToUser(
            post.authorId._id,
            'post_commented',
            {
                title: `${commenter.name} commented on your post`,
                body: commentContent.substring(0, 100),
                imageUrl: commenter.profileImage || null
            },
            {
                postId: postId,
                commentedByUserId: userId,
                commentedByName: commenter.name,
                commentPreview: commentContent.substring(0, 100)
            }
        );
    }
    
    // ... return response ...
}
```

---

### 1.6 User Mentioned Notifications

**File:** `src/services/feed.service.js`

**Trigger Event:** When user is mentioned in a post or comment (e.g., @username)

```javascript
// Current: Create post with mentions
async createPost(userId, content, mentions = []) {
    // ... existing code ...
    
    const post = await Post.create({
        authorId: userId,
        content,
        mentions: mentions  // Array of userIds
    });

    // NEW: Notify mentioned users
    for (const mentionedUserId of mentions) {
        if (mentionedUserId !== userId) {  // Don't notify self
            await firebaseNotificationService.sendToUser(
                mentionedUserId,
                'mention',
                {
                    title: `${author.name} mentioned you`,
                    body: content.substring(0, 100),
                    imageUrl: author.profileImage || null
                },
                {
                    postId: post._id,
                    mentionedByUserId: userId,
                    mentionedByName: author.name,
                    postPreview: content.substring(0, 100)
                }
            );
        }
    }
    
    // ... return response ...
}
```

---

### 1.7 Group Invite Notifications

**File:** `src/services/group.service.js`

**Trigger Event:** When user is invited to a group

```javascript
// Current: Invite user to group
async inviteToGroup(groupId, invitedUserId, invitedByUserId) {
    // ... existing code ...
    
    const groupMember = await GroupMember.create({
        groupId,
        userId: invitedUserId,
        role: 'member',
        status: 'invited'
    });

    // NEW: Notify invited user
    const group = await Group.findById(groupId);
    const inviter = await User.findById(invitedByUserId);
    
    await firebaseNotificationService.sendToUser(
        invitedUserId,
        'group_invite',
        {
            title: `${inviter.name} invited you to ${group.name}`,
            body: group.description?.substring(0, 100) || 'Join this group',
            imageUrl: group.image || null
        },
        {
            groupId: groupId,
            groupName: group.name,
            invitedByUserId: invitedByUserId,
            invitedByName: inviter.name
        }
    );
    
    // ... return response ...
}
```

---

### 1.8 Group Post Notifications

**File:** `src/services/group.service.js`

**Trigger Event:** When a post is created in a group

```javascript
// Current: Post in group
async createGroupPost(groupId, userId, content) {
    // ... existing code ...
    
    const post = await Post.create({
        groupId,
        authorId: userId,
        content,
        type: 'group_post'
    });

    // NEW: Notify all group members (except poster)
    const groupMembers = await GroupMember.find({
        groupId,
        status: 'active',
        userId: { $ne: userId }  // Exclude poster
    }).distinct('userId');

    const author = await User.findById(userId);
    const group = await Group.findById(groupId);
    
    await firebaseNotificationService.sendToUsers(
        groupMembers,
        'group_post',
        {
            title: `${author.name} posted in ${group.name}`,
            body: content.substring(0, 100),
            imageUrl: author.profileImage || null
        },
        {
            groupId: groupId,
            groupName: group.name,
            postId: post._id,
            authorId: userId,
            authorName: author.name
        }
    );
    
    // ... return response ...
}
```

---

## Phase 2: Quiz Server Triggers (Already Implemented)

These are already in the Quiz Server implementation guide:

✅ **sendAuthNotification** - User logs in from new device
✅ **sendQuizAssignedNotification** - Quiz assigned to students
✅ **sendQuizCompletedNotification** - Student submits quiz
✅ **sendGradeReleasedNotification** - Grades are published
✅ **sendAchievementNotification** - Achievement earned

---

## Implementation Checklist

### Microservice Notifications

- [ ] **Friend Requests**
  - [ ] Add import: `import firebaseNotificationService from '../services/firebase-notification.service.js';`
  - [ ] Add notification code to sendFriendRequest()
  - [ ] Add notification code to acceptFriendRequest()
  - [ ] Test: Send friend request and verify notification

- [ ] **Messages**
  - [ ] Add notification code to sendMessage()
  - [ ] Test: Send message and verify notification

- [ ] **Post Interactions**
  - [ ] Add notification code to likePost()
  - [ ] Add notification code to addComment()
  - [ ] Add notification code to mentions
  - [ ] Test: Like post, comment, mention and verify notifications

- [ ] **Groups**
  - [ ] Add notification code to inviteToGroup()
  - [ ] Add notification code to createGroupPost()
  - [ ] Test: Invite to group and create post

---

## Code Template for Each Service

Use this template when adding notifications to each service:

```javascript
// At top of file
import firebaseNotificationService from '../services/firebase-notification.service.js';

// In your event handler
async someEventHandler(params) {
    // 1. Existing logic
    const result = await doSomething();

    // 2. NEW: Get involved user details
    const user = await User.findById(userId);
    const recipient = await User.findById(recipientId);

    // 3. NEW: Send notification
    try {
        await firebaseNotificationService.sendToUser(
            recipientId,
            'notification_type',  // 'friend_request', 'message_received', etc
            {
                title: 'Notification Title',
                body: 'Notification body (preview text)',
                imageUrl: user.profileImage || null
            },
            {
                // Additional data
                userId: user._id,
                userName: user.name,
                type: 'notification_type'
            }
        );
    } catch (error) {
        console.error('Failed to send notification:', error);
        // Don't fail the main operation if notification fails
    }

    // 4. Return result (notification failure shouldn't block the main operation)
    return result;
}
```

---

## Notification Types for Microservice

Use these `type` values when calling `firebaseNotificationService.sendToUser()`:

```javascript
'friend_request'      // New friend request received
'friend_accepted'     // Friend request accepted
'message_received'    // New message in chat
'post_liked'         // Someone liked your post
'post_commented'     // Someone commented on your post
'mention'            // Someone mentioned you
'group_invite'       // Invited to group
'group_post'         // New post in group
'like_alert'         // Like milestone (10, 100, etc)
'comment_alert'      // Comment milestone
```

---

## Testing Your Implementation

After adding each notification trigger:

```bash
# 1. Start the microservice
npm start

# 2. Run the test script in another terminal
node tests/test-notification-send.js

# 3. Manually trigger the event
# - Send friend request
# - Send message
# - Like post
# - Comment on post
# etc.

# 4. Verify notification appears on device
```

---

## Common Pitfalls to Avoid

### ❌ DON'T

```javascript
// Blocking the main operation if notification fails
await firebaseNotificationService.sendToUser(...);  // If this fails, main operation fails

// Notifying the same user (spam)
sendNotificationToAllUsers();  // Including the person who triggered it

// Hardcoding user names (won't update if profile changes)
title: 'John liked your post'

// Forgetting to populate related data
const post = await Post.findById(postId);  // Missing .populate()
```

### ✅ DO

```javascript
// Wrap in try-catch to prevent blocking main operation
try {
    await firebaseNotificationService.sendToUser(...);
} catch (error) {
    console.error('Notification failed:', error);
    // Main operation continues
}

// Exclude the triggering user
recipients.filter(r => r._id.toString() !== userId)

// Fetch fresh data from database
const user = await User.findById(userId);  // Get latest name, image, etc

// Always populate related fields
const post = await Post.findById(postId).populate('authorId');
```

---

## Performance Considerations

### For High-Volume Notifications

If you expect many notifications (e.g., a post goes viral with thousands of likes):

```javascript
// Current approach (for 1-10 receivers)
await firebaseNotificationService.sendToUser(recipientId, ...);

// For many receivers, use batch:
const recipientIds = [...];  // List of 100+ user IDs
await firebaseNotificationService.sendToUsers(recipientIds, ...);
// Firebase handles batching efficiently
```

### Database Indexing

Make sure these fields are indexed in MongoDB:

```javascript
// In your models, add indexes:
db.notifications.createIndex({ recipientUUID: 1, createdAt: -1 });
db.notifications.createIndex({ recipientUUID: 1, isRead: 1 });
db.diceotokens.createIndex({ userUUID: 1, isInvalid: 1 });
```

---

## Timeline Estimate

- **Friend Notifications:** 30 minutes (2 notification points)
- **Message Notifications:** 20 minutes (1 notification point)
- **Post Notifications:** 45 minutes (3 notification points)
- **Group Notifications:** 30 minutes (2 notification points)
- **Testing & Debugging:** 30 minutes

**Total estimated time: 2-3 hours for full microservice integration**

---

## Next Steps After Implementation

1. ✅ Deploy to production
2. ✅ Monitor Firebase quota usage
3. ✅ Check notification delivery rates
4. ✅ Gather user feedback
5. ✅ Adjust notification frequency/timing as needed
6. ✅ Add notification preferences to user settings

---

## Questions Before Starting?

Before you start implementing, verify:

- [ ] Can you access all the service files mentioned?
- [ ] Do all models have the fields we're using (name, profileImage, etc)?
- [ ] Is the notification service imported correctly?
- [ ] Did the test scripts work successfully?

If any of these aren't ready, let me know and I'll help you prepare!
