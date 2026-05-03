# Fix: Notification Actor & Content Schema

**Date:** 2026-05-04  
**File Changed:** `src/repositories/notification.repository.js`

---

## Problem

The `GET /api/v1/notifications` endpoint was returning notifications where:

1. **`actor` was always `null`** — The `findByUser` query fetched raw DB documents and never joined the `User` collection to look up who triggered the notification.
2. **`content.message` was missing** — The database stores notification content as `{ title, body }` but the frontend expects `{ message, postId, commentId, groupId }`.

### Before (broken response)
```json
{
  "_id": "...",
  "type": "post_like",
  "actor": null,
  "content": {
    "title": "New Like",
    "body": "Someone liked your post"
  }
}
```

---

## Fix Applied

### `findByUser` — `notification.repository.js`

**Step 1 — Fetch notifications with `.lean()`**  
Using `.lean()` returns plain JS objects instead of Mongoose documents, making them faster to transform.

**Step 2 — Batch actor lookup (no N+1)**  
All unique `actorUUID` values are extracted from the notification list in one pass. A **single** `User.find()` query fetches all actor profiles at once and builds a lookup map.

**Step 3 — Normalize content shape**  
Each notification is mapped to a standard shape before being returned:

```js
{
  actor: { quizServerUUID, name, avatar } | null,
  content: {
    message: n.content?.body || n.content?.title || '',
    postId:    ...,
    commentId: ...,
    groupId:   ...,
  }
}
```

### After (correct response)
```json
{
  "_id": "...",
  "type": "post_like",
  "actor": {
    "quizServerUUID": "1693476f-63a1-4400-95bb-5d4565227686",
    "name": "Adil",
    "avatar": "https://drive.google.com/uc?export=view&id=..."
  },
  "content": {
    "message": "Adil liked your post",
    "postId": "6639f1a...",
    "commentId": null,
    "groupId": null
  }
}
```

---

## actorUUID — Verified Call Sites

All notification senders already pass `actorUUID` correctly in the `data` object:

| Event             | File                    | actorUUID value         |
|-------------------|-------------------------|-------------------------|
| `post_like`       | `feed.service.js:153`   | `userUUID` (the liker)  |
| `post_comment`    | `feed.service.js:176`   | `userUUID` (commenter)  |
| `post_saved`      | `feed.service.js:282`   | `userUUID` (saver)      |
| `friend_request`  | `friends.service.js:41` | `requesterUUID`         |
| `friend_accepted` | `friends.service.js:94` | `userUUID` (acceptor)   |

No changes needed in the service layer — `actorUUID` was always saved correctly.

---

## Frontend Integration

The frontend `NotificationItem` component should now use:

```tsx
// actor name
notification.actor?.name ?? 'Someone'

// actor avatar
notification.actor?.avatar

// message text
notification.content.message

// navigate to the post
notification.content.postId
```
