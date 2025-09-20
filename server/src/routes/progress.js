const { Router } = require('express');
const { authenticateUser } = require('../middleware/auth');
const { getMyProgress, incrementMaterial } = require('../controllers/progressController');

const router = Router();
router.use(authenticateUser);
router.get('/me', getMyProgress);
router.post('/course/:courseId/material', incrementMaterial);

module.exports = router;


