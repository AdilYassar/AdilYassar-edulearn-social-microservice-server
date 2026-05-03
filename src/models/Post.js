const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  authorUUID: { type: String, required: true, index: true },
  
  // Post type and content
  type: { type: String, enum: ['progress', 'question', 'achievement', 'general', 'announcement', 'news'], default: 'general' },
  contentType: { type: String, enum: ['text', 'image', 'video', 'poll'], default: 'text' }, // Helper for frontend
  content: {
    text: { type: String },
    
    // Media attachments
    media: [{
      mediaId: { type: String },         // Google Drive file ID
      url: { type: String },             // Direct access URL
      fileName: { type: String },
      fileSize: { type: Number },
      mimeType: { type: String },
      width: { type: Number },
      height: { type: Number },
      aspectRatio: { type: Number },
      duration: { type: Number },          // For voice notes (seconds)
      type: { type: String, enum: ['image', 'video'] },
      thumbnail: { type: String },       // Google Drive file ID
      thumbnailUrl: { type: String },    // Direct thumbnail URL
      caption: { type: String }
    }],
    
    // For progress updates (linked to Quiz Server data)
    progress: {
      type: { type: String },            // "course_completed", "quiz_passed", "streak"
      courseId: { type: String },        // From Quiz Server
      courseName: { type: String },
      quizId: { type: String },          // From Quiz Server
      quizName: { type: String },
      score: { type: Number },
      grade: { type: String },           // A+, A, B+, etc.
      milestone: { type: String },
      achievement: { type: String }
    },
    
    // For question posts
    question: {
      title: { type: String },
      category: { type: String },        // Subject area
      tags: [{ type: String }],
      courseId: { type: String },        // Optional link to course
      isAnswered: { type: Boolean, default: false },
      acceptedAnswerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }
    }
  },
  
  // Post visibility
  visibility: { type: String, enum: ['public', 'friends', 'course_mates'], default: 'public' },
  courseId: { type: String, index: true },            // If visible only to course enrollees
  
  // Engagement tracking
  stats: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 }
  },
  
  // Social features
  mentions: [{ type: String }],          // UUIDs of tagged users
  hashtags: [{ type: String, index: true }],
  
  // Post status
  isPinned: { type: Boolean, default: false },
  isModerated: { type: Boolean, default: false },
  moderationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  moderatedByUUID: { type: String },
  moderatedAt: { type: Date },
  moderationReason: { type: String },
  
  // Edit/Delete
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for author information
postSchema.virtual('author', {
  ref: 'User',
  localField: 'authorUUID',
  foreignField: 'quizServerUUID',
  justOne: true
});

postSchema.index({ authorUUID: 1, createdAt: -1 });
postSchema.index({ visibility: 1, createdAt: -1 });
postSchema.index({ type: 1, createdAt: -1 });
postSchema.index({ moderationStatus: 1 });

module.exports = mongoose.model('Post', postSchema);
