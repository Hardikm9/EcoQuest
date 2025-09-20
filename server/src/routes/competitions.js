const { Router } = require('express');
const { authenticateUser } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { createCompetition, listCompetitions, joinCompetition } = require('../controllers/competitionController');

const router = Router();
router.get('/', listCompetitions);
router.post('/', authenticateUser, authorizeRoles('admin'), createCompetition);
router.post('/:id/join', authenticateUser, authorizeRoles('student'), joinCompetition);

module.exports = router;


