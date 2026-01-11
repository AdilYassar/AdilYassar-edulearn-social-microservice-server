const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientUUID: { type: String, required: true, index: true },
  
  // Notification details
  type: { 
    type: String, 
    enum: ['friend_request', 'friend_accepted', 'message', 'group_invite', 'post_like', 'post_comment', 'mention', 'achievement', 'system'], 
    required: true 
  },
  actorUUID: { type: String },           // Who triggered this notification
  
  // Target reference
  targetType: { type: String, enum: ['conversation', 'post', 'comment', 'friendship', 'group'] },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  
  // Notification content
  content: {
    title: { type: String },
    body: { type: String },
    imageUrl: { type: String },
    actionUrl: { type: String },
    data: { type: mongoose.Schema.Types.Mixed }               // Additional metadata
  },
  
  // Status
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  isSent: { type: Boolean, default: false },             // For push notifications
  sentAt: { type: Date },
  
  expiresAt: { type: Date, expires: 0 }  // TTL index usage
}, { 
  timestamps: true 
});

notificationSchema.index({ recipientUUID: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
