const { Router } = require('express');
const { authenticateUser } = require('../middleware/auth');
const { createThread, listThreads, getThread, postMessage } = require('../controllers/communityController');

const router = Router();

router.use(authenticateUser);
router.get('/', listThreads);
router.post('/', createThread);
router.post('/:threadId/messages', postMessage);
router.get('/:threadId', getThread);

module.exports = router;


