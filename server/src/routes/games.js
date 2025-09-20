const { Router } = require('express');
const { authenticateUser } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { completeGame } = require('../controllers/gameController');

const router = Router();
router.post('/course/:courseId/complete', authenticateUser, authorizeRoles('student'), completeGame);

module.exports = router;


