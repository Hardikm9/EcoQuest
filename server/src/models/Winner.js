const mongoose = require('mongoose');

const WinnerAnnouncementSchema = new mongoose.Schema(
  {
    period: { type: String, enum: ['weekly', 'monthly'], required: true },
    minPoints: { type: Number, default: 0 },
    winnersCount: { type: Number, default: 3 },
    winners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    active: { type: Boolean, default: true, index: true },
    effectiveFrom: { type: Date },
    effectiveTo: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WinnerAnnouncement', WinnerAnnouncementSchema);


