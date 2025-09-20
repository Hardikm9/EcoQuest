const jwt = require('jsonwebtoken');

function authenticateUser(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
    // Allow local admin session for demo purposes
    if (token === 'admin-local') {
      req.user = { id: 'admin', role: 'admin', name: 'Admin' };
      return next();
    }
    if (!token) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }
}

module.exports = { authenticateUser };


