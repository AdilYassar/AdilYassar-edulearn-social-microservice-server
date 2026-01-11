const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema({
  requesterUUID: { type: String, required: true, index: true },
  recipientUUID: { type: String, required: true, index: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'blocked'], 
    default: 'pending' 
  },
  
  // Request metadata
  requestedAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
  message: { type: String }, // Optional message with request
}, { 
  timestamps: true 
});

// Indexes for fast lookups
friendshipSchema.index({ requesterUUID: 1, recipientUUID: 1 }, { unique: true });
friendshipSchema.index({ requesterUUID: 1, status: 1 });
friendshipSchema.index({ recipientUUID: 1, status: 1 });

module.exports = mongoose.model('Friendship', friendshipSchema);
