const { Router } = require('express');
const { authenticateUser } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { createAssignment, submitAssignment, gradeSubmission, getAssignment } = require('../controllers/assignmentController');

const router = Router();

router.post('/course/:courseId', authenticateUser, authorizeRoles('teacher'), createAssignment);
router.post('/:assignmentId/submit', authenticateUser, authorizeRoles('student'), submitAssignment);
router.post('/:assignmentId/submissions/:submissionId/grade', authenticateUser, authorizeRoles('teacher'), gradeSubmission);
router.get('/:assignmentId', authenticateUser, authorizeRoles('teacher'), getAssignment);

module.exports = router;


