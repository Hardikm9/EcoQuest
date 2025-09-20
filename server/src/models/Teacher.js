const mongoose = require('mongoose');

const TeacherSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    isApproved: { type: Boolean, default: false },
    resumeFileId: { type: mongoose.Schema.Types.ObjectId },
    resumeUrl: { type: String },
    details: { type: String },
    qualification: { type: String },
    contact: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Teacher', TeacherSchema);


