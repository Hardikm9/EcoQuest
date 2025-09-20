const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    materialsCompleted: { type: Number, default: 0 },
    quizzesCompleted: { type: Number, default: 0 },
    assignmentsSubmitted: { type: Number, default: 0 },
    gamesCompleted: { type: Number, default: 0 },
    progressPercent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProgressSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Progress', ProgressSchema);


