const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contentUrl: { type: String, required: true },
    grade: { type: Number },
    feedback: { type: String },
    gradedAt: { type: Date },
  },
  { timestamps: true }
);

const AssignmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date },
    submissions: [SubmissionSchema],
    points: { type: Number, default: 20 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', AssignmentSchema);


