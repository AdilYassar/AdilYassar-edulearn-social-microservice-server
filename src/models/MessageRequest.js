const mongoose = require('mongoose');

const messageRequestSchema = new mongoose.Schema({
  senderUUID: { type: String, required: true, index: true },
  recipientUUID: { type: String, required: true, index: true },
  
  // Request details
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  firstMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  message: { type: String },             // Optional request message
  
  // Status
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'ignored'], default: 'pending' },
  respondedAt: { type: Date },
}, { 
  timestamps: true 
});

messageRequestSchema.index({ recipientUUID: 1, status: 1 });
messageRequestSchema.index({ senderUUID: 1, recipientUUID: 1 }, { unique: true });

module.exports = mongoose.model('MessageRequest', messageRequestSchema);
