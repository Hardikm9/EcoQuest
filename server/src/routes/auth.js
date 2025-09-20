const { Router } = require('express');
const { register, login, logout, googleAuth } = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');
const User = require('../models/User');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/google', googleAuth);

// Save selected teachers for logged-in student
router.post('/me/selected-teachers', authenticateUser, async (req, res) => {
  try {
    const { teacherIds } = req.body;
    if (!Array.isArray(teacherIds)) return res.status(400).json({ error: { message: 'teacherIds must be array' } });
    await User.findByIdAndUpdate(req.user.id, { $set: { selectedTeachers: teacherIds } }, { new: true });
    res.json({ data: { saved: true } });
  } catch (e) {
    res.status(500).json({ error: { message: 'Failed to save selection' } });
  }
});

// Get selected teachers for logged-in student
router.get('/me/selected-teachers', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('selectedTeachers','name email');
    const selected = (user?.selectedTeachers || []).map(t => ({ id: t._id, name: t.name, email: t.email }));
    res.json({ data: selected });
  } catch (e) {
    res.status(500).json({ error: { message: 'Failed to load selection' } });
  }
});

module.exports = router;


