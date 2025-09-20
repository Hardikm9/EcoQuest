const { Router } = require('express');
const { authenticateUser } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { createCourse, listCourses, getCourse, enrollInCourse, addMaterial, listMyCourses } = require('../controllers/courseController');

const router = Router();

router.get('/', listCourses);
router.get('/:id', authenticateUser, getCourse);
router.post('/', authenticateUser, authorizeRoles('teacher'), createCourse);
router.post('/:id/enroll', authenticateUser, authorizeRoles('student'), enrollInCourse);
router.post('/:id/materials', authenticateUser, authorizeRoles('teacher'), addMaterial);
router.get('/me/teacher', authenticateUser, authorizeRoles('teacher'), listMyCourses);

module.exports = router;


