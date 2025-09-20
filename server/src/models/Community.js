const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    author: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    content: { 
      type: String, 
      required: true,
      trim: true
    },
    replies: [
      {
        author: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'User', 
          required: true 
        },
        content: { 
          type: String, 
          required: true,
          trim: true
        },
        createdAt: { 
          type: Date, 
          default: Date.now 
        },
      },
    ],
  },
  { timestamps: true }
);

const CommunitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "EcoLearn Community"
    },
    description: {
      type: String,
      default: "A place for students and teachers to connect"
    },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

// Create indexes for better performance
CommunitySchema.index({ 'messages.author': 1 });

module.exports = mongoose.model('Community', CommunitySchema);