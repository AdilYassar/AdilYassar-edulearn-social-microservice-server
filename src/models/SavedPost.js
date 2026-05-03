const mongoose = require('mongoose');

const savedPostSchema = new mongoose.Schema({
  userUUID: { type: String, required: true, index: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
}, { 
  timestamps: true 
});

// Prevent duplicate saves and optimize lookup
savedPostSchema.index({ userUUID: 1, postId: 1 }, { unique: true });

module.exports = mongoose.model('SavedPost', savedPostSchema);
