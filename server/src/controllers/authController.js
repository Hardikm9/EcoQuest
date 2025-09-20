const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Teacher = require('../models/Teacher');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('student', 'teacher').required(),
});

async function register(req, res) {
  try {
    const { value, error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: { message: error.message } });

    const { name, email, password, role } = value;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: { message: 'Email already in use' } });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      passwordHash,
      authProvider: 'local',
      role,
    });

    if (role === 'teacher') {
      await Teacher.create({ user: user._id, isApproved: false });
    }

    return res.status(201).json({ data: { id: user._id, role: user.role } });
  } catch (err) {
    return res.status(500).json({ error: { message: 'Registration failed' } });
  }
}

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

async function login(req, res) {
  try {
    const { value, error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: { message: error.message } });

    const { email, password } = value;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: { message: 'Invalid credentials' } });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: { message: 'Invalid credentials' } });

    // Ensure Teacher document exists for teacher users
    let teacherDoc = null;
    if (user.role === 'teacher') {
      teacherDoc = await Teacher.findOne({ user: user._id });
      if (!teacherDoc) {
        teacherDoc = await Teacher.create({ user: user._id, isApproved: false });
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '7d' }
    );

    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ data: { token, role: user.role, name: user.name, id: user._id, teacher: teacherDoc ? { id: teacherDoc._id, isApproved: teacherDoc.isApproved } : undefined } });
  } catch (err) {
    return res.status(500).json({ error: { message: 'Login failed' } });
  }
}

function logout(req, res) {
  res.clearCookie('token');
  return res.json({ data: { message: 'Logged out' } });
}

// GOOGLE OAUTH
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuthSchema = Joi.object({
  idToken: Joi.string().required(),
  role: Joi.string().valid('student', 'teacher').required(),
});

async function googleAuth(req, res) {
  try {
    const { value, error } = googleAuthSchema.validate(req.body);
    if (error) return res.status(400).json({ error: { message: error.message } });

    const { idToken, role } = value;
    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || payload.given_name || 'Google User';

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await User.create({
        name,
        email,
        authProvider: 'google',
        googleId,
        role,
      });
      if (role === 'teacher') {
        await Teacher.create({ user: user._id, isApproved: false });
      }
    } else {
      // Upgrade to google auth if needed and update role if first-time role selection
      if (!user.googleId) user.googleId = googleId;
      if (user.authProvider !== 'google') user.authProvider = 'google';
      if (!user.role && role) user.role = role; // unlikely since role required
      await user.save();
      if (user.role === 'teacher') {
        const existingTeacher = await Teacher.findOne({ user: user._id });
        if (!existingTeacher) {
          await Teacher.create({ user: user._id, isApproved: false });
        }
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '7d' }
    );

    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
    const teacherDoc = user.role === 'teacher' ? await Teacher.findOne({ user: user._id }) : null;
    return res.json({ data: { token, role: user.role, name: user.name, id: user._id, teacher: teacherDoc ? { id: teacherDoc._id, isApproved: teacherDoc.isApproved } : undefined } });
  } catch (err) {
    return res.status(500).json({ error: { message: 'Google authentication failed' } });
  }
}

module.exports = { register, login, logout, googleAuth };


