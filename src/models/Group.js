const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  avatar: { type: String },              // Google Drive file ID
  
  // Group ownership
  createdByUUID: { type: String, required: true, index: true },
  adminUUIDs: [{ type: String }],        // Can add/remove members, change settings
  moderatorUUIDs: [{ type: String }],    // Can delete messages, ban members
  
  // Group settings
  settings: {
    maxMembers: { type: Number, default: 256 },
    joinApproval: { type: Boolean, default: false },     // Admins must approve new members
    allowMemberInvites: { type: Boolean, default: true },
    onlyAdminsCanPost: { type: Boolean, default: false },
    showReadReceipts: { type: Boolean, default: true }
  },
  
  // Link to conversation
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  
  // Group type (for course-related groups)
  groupType: { type: String, enum: ['general', 'course', 'study'], default: 'general' },
  courseId: { type: String, index: true },            // If linked to a course from Quiz Server
  
  // Status
  isActive: { type: Boolean, default: true },
}, { 
  timestamps: true 
});

groupSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model('Group', groupSchema);
