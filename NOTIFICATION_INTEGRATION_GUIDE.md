# 🔔 Notification Integration Guide (Frontend)

This guide explains how to handle real-time and push notifications from the Social Microservice. We recently updated the system to support rich icons and improved delivery reliability.

---

## 1. Icon & Type Mapping
The backend now sends specific `type` strings that match your `NotificationItem.tsx` configuration. Use this matrix to ensure the correct icon and color are displayed.

| Backend Type | Frontend Icon | Color | Purpose |
| :--- | :--- | :--- | :--- |
| `announcement` | `bullhorn` | Orange | Global system-wide announcements |
| `video_broadcast` | `video-check` | Red | New video upload broadcasted to everyone |
| `news_broadcast` | `earth` | Indigo | New news update broadcasted to everyone |
| `post_new` | `newspaper` | Green | Regular post shared by a friend |
| `post_like` | `heart` | Pink | Someone liked your post |
| `post_comment` | `comment-text` | Blue | Someone commented on your post |
| `comment_reply` | `comment-arrow-right`| Blue | Someone replied to your comment |
| `comment_like` | `heart-outline` | Pink | Someone liked your comment |
| `friend_request` | `account-plus` | Purple | New friend request received |

---

## 2. Notification Payload Structure
We send the **full Post object** stringified in the `payload` field. This allows the app to show a detailed preview or update the feed immediately without an extra API call.

### Typical Data Payload (JSON):
```json
{
  "type": "post_new",
  "subType": "POST_CREATED",
  "payload": "{...JSON stringified post object...}", 
  "targetType": "post",
  "targetId": "65d123abc...",
  "actorUUID": "user-uuid-..."
}
```

**Note:** Always `JSON.parse(notification.data.payload)` to get the post object.

---

## 3. Handling Navigation
When a user taps a notification or an item in the list, use the `type` and `targetId` to route them:

```javascript
const handleNotificationPress = (notification) => {
  const { type, content } = notification;
  const targetId = content.postId || content.targetId;

  switch (type) {
    case 'announcement':
    case 'video_broadcast':
    case 'post_new':
    case 'post_like':
    case 'post_comment':
      // Navigate to Post Detail Screen
      navigation.navigate('PostDetail', { postId: targetId });
      break;
      
    case 'comment_reply':
    case 'comment_like':
      // Navigate to Comment section or specific post
      navigation.navigate('PostDetail', { postId: content.postId, highlightCommentId: targetId });
      break;
      
    case 'friend_request':
      navigation.navigate('FriendRequests');
      break;
      
    case 'message':
      navigation.navigate('ChatDetail', { conversationId: targetId });
      break;
  }
};
```

---

## 4. Real-time Socket Events
Listen for these events to update the UI without a page refresh:

### New Notification
```javascript
socket.on('notification:new', (notification) => {
  // 1. Update the Redux state
  dispatch(addNotification(notification));
  
  // 2. Show an in-app toast if the user isn't on the Notifications screen
  if (currentScreen !== 'Notifications') {
    Toast.show({
      text1: notification.actor.name,
      text2: notification.content.message,
      onPress: () => handleNotificationPress(notification)
    });
  }
});
```

---

## 5. Troubleshooting for Frontend
- **"0/1" Delivery Failures**: If the backend logs show `0/1` for push notifications, it means the Firebase token on the device is invalid. Ask the user to log out and log back in to refresh the token.
- **Wrong Icons**: If an announcement shows a default "bell" icon, check if the `type` matches the table in Section 1.
- **Empty Previews**: Ensure you are accessing `notification.content.message` for the body text.

---
**Social Microservice Backend Team** 🚀
