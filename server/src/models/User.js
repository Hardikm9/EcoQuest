const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    // For OAuth users, passwordHash may be absent
    passwordHash: { type: String },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local', index: true },
    googleId: { type: String, index: true },
    role: { type: String, enum: ['student', 'teacher', 'admin'], required: true },
    ecoPoints: { type: Number, default: 0, index: true },
    badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
    achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
    // Student specific
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    selectedTeachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Teacher-specific data moved to Teacher model for separation
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = function comparePassword(plain) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);


