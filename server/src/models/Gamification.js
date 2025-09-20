const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    thresholdPoints: { type: Number, required: true },
    iconUrl: { type: String },
  },
  { timestamps: true }
);

const AchievementSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    criteria: { type: String },
  },
  { timestamps: true }
);

const LeaderboardEntrySchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    ecoPoints: { type: Number, default: 0, index: true },
    rank: { type: Number, index: true },
  },
  { timestamps: true }
);

const CompetitionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    winners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = {
  Badge: mongoose.model('Badge', BadgeSchema),
  Achievement: mongoose.model('Achievement', AchievementSchema),
  LeaderboardEntry: mongoose.model('LeaderboardEntry', LeaderboardEntrySchema),
  Competition: mongoose.model('Competition', CompetitionSchema),
};


