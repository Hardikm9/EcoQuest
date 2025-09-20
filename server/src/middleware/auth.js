const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

async function authenticateUser(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
    
    // Allow local admin session for demo purposes
    if (token === 'admin-local') {
      // Fetch the admin user from database using the fixed ObjectId
      const adminUser = await User.findById('000000000000000000000000');
      
      if (!adminUser) {
        return res.status(401).json({ error: { message: 'Admin user not found in database' } });
      }
      
      req.user = {
        id: adminUser._id.toString(),
        _id: adminUser._id,
        role: adminUser.role,
        name: adminUser.name,
        email: adminUser.email
      };
      return next();
    }
    
    if (!token) return res.status(401).json({ error: { message: 'Unauthorized' } });
    
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    
    // Fetch the full user from database to ensure we have the correct ID field
    const user = await User.findById(payload.id || payload._id);
    
    if (!user) {
      return res.status(401).json({ error: { message: 'User not found' } });
    }
    
    // Set req.user with both id and _id for compatibility
    req.user = {
      id: user._id.toString(),
      _id: user._id,
      role: user.role,
      name: user.name,
      email: user.email
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }
}

module.exports = { authenticateUser };