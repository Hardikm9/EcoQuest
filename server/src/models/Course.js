const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['pdf', 'video', 'article', 'book'], required: true },
    title: { type: String, required: true },
    description: { type: String },
    // Replaced 'url' with fileId and filename
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
  },
  { timestamps: true }
);

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl: { type: String },
    videoUrl: { type: String },
    materials: [MaterialSchema],
    quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
    assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', CourseSchema);