const Notification = require('../models/Notification');
const User = require('../models/User');
const { emitToUser, broadcast } = require('../services/realtime');

async function createNotification(req, res) {
  try {
    const { recipient, type, title, body, meta } = req.body;
    const n = await Notification.create({ recipient, type, title, body, meta });
    try { emitToUser(recipient, 'notification:new', n); } catch (e) {}
    res.status(201).json({ data: n });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to create notification' } });
  }
}

async function listMyNotifications(req, res) {
  try {
    const list = await Notification.find({ recipient: req.user.id }).sort({ createdAt: -1 });
    res.json({ data: list });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to list notifications' } });
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const n = await Notification.findOneAndUpdate({ _id: id, recipient: req.user.id }, { isRead: true }, { new: true });
    if (!n) return res.status(404).json({ error: { message: 'Not found' } });
    res.json({ data: n });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to mark read' } });
  }
}

// Simple helper for teacher to send a message to admin
async function sendToAdmin(req, res) {
  try {
    const { title, body } = req.body;
    // Convention: recipient set to a special admin broadcast value isn't supported in schema; we will later fanout.
    // For now, store with meta.role='admin' and recipient as current user to keep a log; admin UI can filter.
    const n = await Notification.create({ recipient: req.user.id, type: 'system', title, body, meta: { toRole: 'admin' } });
    try { broadcast('notification:to-admin', { from: req.user.id, title, body }); } catch (e) {}
    res.status(201).json({ data: n });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to send message' } });
  }
}

module.exports = { createNotification, listMyNotifications, markAsRead, sendToAdmin };

// Admin or privileged: send to a specific user by email
async function createNotificationByEmail(req, res) {
  try {
    const { recipientEmail, type, title, body, meta } = req.body;
    const user = await User.findOne({ email: recipientEmail });
    if (!user) return res.status(404).json({ error: { message: 'Recipient not found' } });
    const n = await Notification.create({ recipient: user._id, type, title, body, meta });
    try { emitToUser(user._id, 'notification:new', n); } catch (e) {}
    res.status(201).json({ data: n });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to send notification' } });
  }
}

module.exports.createNotificationByEmail = createNotificationByEmail;


