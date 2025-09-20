const { Router } = require('express');
const { authenticateUser } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { createQuiz, submitQuiz } = require('../controllers/quizController');

const router = Router();

router.post('/course/:courseId', authenticateUser, authorizeRoles('teacher'), createQuiz);
router.post('/:quizId/submit', authenticateUser, authorizeRoles('student'), submitQuiz);

module.exports = router;


