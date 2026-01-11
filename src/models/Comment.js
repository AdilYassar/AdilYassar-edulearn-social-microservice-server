const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  authorUUID: { type: String, required: true, index: true },
  
  // Comment content
  content: {
    text: { type: String, required: true },
    media: [{
      mediaId: { type: String },
      type: { type: String }
    }]
  },
  
  // Threading
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', index: true }, // For nested comments/replies
  
  // Engagement
  stats: {
    likes: { type: Number, default: 0 },
    replies: { type: Number, default: 0 }
  },
  mentions: [{ type: String }],          // UUIDs
  
  // For question posts
  isAnswer: { type: Boolean, default: false },           // If this is an answer to a question
  isAccepted: { type: Boolean, default: false },         // If this is the accepted answer
  
  // Edit/Delete
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
}, { 
  timestamps: true 
});

commentSchema.index({ postId: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', commentSchema);
