const { Router } = require('express');
const { authenticateUser } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getFile } = require('../controllers/fileController');

const router = Router();

// Route for serving files from GridFS
router.get('/:id', getFile);

// The upload route can be combined with the addMaterial logic.
// So, we'll update the courses route instead.

module.exports = router;