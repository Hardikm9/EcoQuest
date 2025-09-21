const User = require('../models/User');

async function updateEcoPoints(userId, points, metadata = {}) {
  try {
    const user = await User.findById(userId);
    if (user) {
      user.ecoPoints = (user.ecoPoints || 0) + points;
      await user.save();
    }
  } catch (error) {
    console.error(`Failed to update ecoPoints for user ${userId}:`, error);
  }
}

module.exports = { updateEcoPoints };
