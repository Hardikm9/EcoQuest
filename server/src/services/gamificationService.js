const User = require('../models/User');
const { Badge, LeaderboardEntry } = require('../models/Gamification');

async function recalcLeaderboard() {
  const top = await User.find({ role: 'student' }).select('_id ecoPoints').sort({ ecoPoints: -1 });
  for (let rank = 0; rank < top.length; rank += 1) {
    const userId = top[rank]._id;
    await LeaderboardEntry.findOneAndUpdate(
      { student: userId },
      { ecoPoints: top[rank].ecoPoints, rank: rank + 1 },
      { upsert: true }
    );
  }
}

async function checkAndAwardBadges(userId, newTotalPoints) {
  const badges = await Badge.find().sort({ thresholdPoints: 1 });
  const user = await User.findById(userId).select('badges');
  for (const badge of badges) {
    if (newTotalPoints >= badge.thresholdPoints) {
      const has = user.badges.some((b) => String(b) === String(badge._id));
      if (!has) {
        await User.findByIdAndUpdate(userId, { $addToSet: { badges: badge._id } });
      }
    }
  }
}

async function updateEcoPoints(userId, deltaPoints, meta = {}) {
  const updated = await User.findByIdAndUpdate(userId, { $inc: { ecoPoints: deltaPoints } }, { new: true });
  await checkAndAwardBadges(userId, updated.ecoPoints);
  await recalcLeaderboard();
  return updated.ecoPoints;
}

module.exports = { updateEcoPoints };


