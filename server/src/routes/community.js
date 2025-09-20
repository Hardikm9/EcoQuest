const express = require('express');
const router = express.Router(); // Use express.Router() here too
const { authenticateUser } = require('../middleware/auth');
const { getCommunity, postMessage, postReply } = require('../controllers/communityController');

// All community routes require authentication
router.use(authenticateUser);

// Get community messages
router.get('/', getCommunity);

// Post a new message
router.post('/messages', postMessage);

// Post a reply to a message
router.post('/messages/:messageId/replies', postReply);

module.exports = router;