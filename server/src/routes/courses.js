const { Router } = require('express');
const { authenticateUser } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { createCourse, listCourses, getCourse, enrollInCourse, addMaterial, listMyCourses } = require('../controllers/courseController');
const upload = require('../middleware/upload'); // Import the upload middleware

const router = Router();

router.get('/', authenticateUser, listCourses); // Authenticate to get user role
router.get('/:id', authenticateUser, getCourse);
router.post('/', authenticateUser, authorizeRoles('teacher'), createCourse);
router.post('/:id/enroll', authenticateUser, authorizeRoles('student'), enrollInCourse);

// Use the upload middleware here. It will process one file attached to the 'file' field.
router.post('/:id/materials', authenticateUser, authorizeRoles('teacher'), upload.single('file'), addMaterial);

router.get('/me/teacher', authenticateUser, authorizeRoles('teacher'), listMyCourses);

module.exports = router;