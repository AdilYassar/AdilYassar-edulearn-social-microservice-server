const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  quizServerUUID: { type: String, required: true, unique: true, index: true },
  userType: { type: String, enum: ['student', 'admin'], required: true },
  
  // Cached display data (synced from Quiz Server)
  name: { type: String, index: 'text' },
  avatar: { type: String }, // Google Drive file ID
  
  // Social-specific fields only
  bio: { type: String, default: '' },
  
  socialSettings: {
    privacy: {
      profileVisibility: { 
        type: String, 
        enum: ['public', 'friends', 'private'], 
        default: 'friends' 
      },
      allowMessageRequests: { type: Boolean, default: true },
      showOnlineStatus: { type: Boolean, default: true },
      showLearningProgress: { type: Boolean, default: true }
    },
    notifications: {
      messages: { type: Boolean, default: true },
      friendRequests: { type: Boolean, default: true },
      postLikes: { type: Boolean, default: true },
      postComments: { type: Boolean, default: true }
    }
  },
  
  // Presence tracking
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  
  // Sync tracking
  lastSyncedAt: { type: Date, default: Date.now },
  
  // Status
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('User', userSchema);
