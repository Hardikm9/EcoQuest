const { Router } = require('express');
const { authenticateUser } = require('../middleware/auth');
const { uploadResume, getResume, updateProfile, getMyProfile, upload, uploadFile, getFile } = require('../controllers/teacherController');
const Teacher = require('../models/Teacher');

const router = Router();

// Public approved teachers list for students (no auth)
router.get('/approved', async (req, res) => {
  try {
    const docs = await Teacher.find({ isApproved: true }).populate('user','name email').select('user qualification contact isApproved');
    const result = docs
      .filter(t => !!t.user)
      .map(t => ({ id: t.user._id, name: t.user.name, email: t.user.email, qualification: t.qualification, contact: t.contact }));
    res.json({ data: result });
  } catch (e) {
    res.status(500).json({ error: { message: 'Failed to load approved teachers' } });
  }
});

router.use(authenticateUser);

router.get('/me', getMyProfile);
router.post('/resume', upload.single('resume'), uploadResume);
router.get('/resume/:teacherId', getResume);
router.post('/profile', updateProfile);
router.post('/upload', upload.single('file'), uploadFile);
router.get('/file/:fileId', getFile);

module.exports = router;


