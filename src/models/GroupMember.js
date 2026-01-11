const mongoose = require('mongoose');

const groupMemberSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
  userUUID: { type: String, required: true, index: true },
  
  // Member role
  role: { type: String, enum: ['admin', 'moderator', 'member'], default: 'member' },
  
  // Member status
  status: { type: String, enum: ['active', 'left', 'removed', 'banned'], default: 'active' },
  
  // Join information
  joinedAt: { type: Date, default: Date.now },
  invitedByUUID: { type: String },       // Who invited this member
  joinMethod: { type: String, enum: ['invited', 'link', 'requested', 'creator'] },
  
  // Leave/Remove information
  leftAt: { type: Date },
  removedByUUID: { type: String },
  removalReason: { type: String },
  
  // Member permissions (override group settings)
  canPost: { type: Boolean, default: true },
  canInvite: { type: Boolean, default: true },
}, { 
  timestamps: true 
});

groupMemberSchema.index({ groupId: 1, userUUID: 1 }, { unique: true });
groupMemberSchema.index({ userUUID: 1, status: 1 });

module.exports = mongoose.model('GroupMember', groupMemberSchema);
