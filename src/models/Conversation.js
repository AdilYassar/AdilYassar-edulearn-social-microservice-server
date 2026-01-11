const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  type: { type: String, enum: ['direct', 'group'], required: true },
  participantUUIDs: [{ type: String, index: true }], // Array of Student/Admin UUIDs
  
  // Last message preview for lists
  lastMessage: {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    senderUUID: { type: String },
    preview: { type: String },
    timestamp: { type: Date },
    type: { type: String }
  },
  
  // Unread counts per user
  unreadCounts: [{
    userUUID: { type: String },
    count: { type: Number, default: 0 }
  }],
  
  // Conversation settings
  isArchived: { type: Boolean, default: false },
  mutedBy: [{ type: String }],           // UUIDs of users who muted
  
  // For direct chats
  initiatorUUID: { type: String },       // Who started the conversation
  
  // For group chats (optional link)
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }
}, { 
  timestamps: true 
});

// conversationSchema.index({ participantUUIDs: 1 });
conversationSchema.index({ type: 1, updatedAt: -1 });
conversationSchema.index({ "lastMessage.timestamp": -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
