const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  userUUID: { type: String, required: true, index: true },
  targetType: { type: String, enum: ['post', 'comment'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
}, { 
  timestamps: true 
});

likeSchema.index({ userUUID: 1, targetType: 1, targetId: 1 }, { unique: true });
likeSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('Like', likeSchema);
