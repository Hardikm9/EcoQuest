const { Router } = require('express');
const { authenticateUser } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roles');
const { approveTeacher, listUsers, getLeaderboard, listTeachersDetailed, listStudentsDetailed, broadcastNotification, listApprovedTeachers, listAllContent, configureLeaderboard, getLatestWinners, approveCourse } = require('../controllers/adminController');

const router = Router();

router.use(authenticateUser, authorizeRoles('admin'));
router.post('/approve-teacher', approveTeacher);
router.post('/approve-course', approveCourse);
router.get('/users', listUsers);
router.get('/leaderboard', getLeaderboard);
router.get('/teachers/detailed', listTeachersDetailed);
router.get('/teachers/approved', listApprovedTeachers);
router.get('/students/detailed', listStudentsDetailed);
router.get('/content', listAllContent);
router.post('/broadcast', broadcastNotification);
router.post('/leaderboard', configureLeaderboard);
router.get('/leaderboard/latest', getLatestWinners);

module.exports = router;
