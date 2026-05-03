const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  senderUUID: { type: String, required: true, index: true },
  
  // Message content
  type: { 
    type: String, 
    enum: ['text', 'image', 'video', 'voice', 'document', 'location', 'system', 'post'], 
    default: 'text' 
  },
  content: {
    text: { type: String },              
    
    // For media messages
    mediaId: { type: String },           // Google Drive file ID
    url: { type: String },               // Direct access URL
    fileName: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    duration: { type: Number },          // For voice notes (seconds)
    thumbnail: { type: String },         // Google Drive file ID for thumbnails
    thumbnailUrl: { type: String },      // Direct thumbnail URL

    // For shared posts
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }, 
    
    // For location sharing
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
      placeName: { type: String }
    },
    
    // Additional metadata
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  
  // Message features
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  reactions: [{
    userUUID: { type: String },
    emoji: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  mentions: [{ type: String }],          // UUIDs of mentioned users
  
  // Delivery tracking
  status: { type: String, enum: ['sending', 'sent', 'delivered', 'read', 'failed'], default: 'sending' },
  deliveredTo: [{
    userUUID: { type: String },
    deliveredAt: { type: Date }
  }],
  readBy: [{
    userUUID: { type: String },
    readAt: { type: Date }
  }],
  
  // Edit/Delete tracking
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  editHistory: [{
    text: { type: String },
    editedAt: { type: Date }
  }],
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedFor: [{ type: String }],        // UUIDs (for "delete for me")
}, { 
  timestamps: true 
});

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ "content.mediaId": 1 }, { sparse: true });

module.exports = mongoose.model('Message', messageSchema);
