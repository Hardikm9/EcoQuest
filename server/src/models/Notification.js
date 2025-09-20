const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['assignment', 'competition', 'approval', 'system'], required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    meta: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);


