const { Router } = require('express');
const { authenticateUser } = require('../middleware/auth');
const { createNotification, listMyNotifications, markAsRead, sendToAdmin, createNotificationByEmail } = require('../controllers/notificationController');

const router = Router();

router.use(authenticateUser);
router.get('/', listMyNotifications);
router.post('/', createNotification);
router.post('/by-email', createNotificationByEmail);
router.post('/:id/read', markAsRead);
router.post('/send-to-admin', sendToAdmin);

module.exports = router;


