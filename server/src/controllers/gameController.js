const Progress = require('../models/Progress');
const { updateEcoPoints } = require('../services/gamificationService');

async function completeGame(req, res) {
  try {
    const { courseId } = req.params;
    const points = Number(req.body.points || 10);
    await Progress.findOneAndUpdate(
      { student: req.user.id, course: courseId },
      { $inc: { gamesCompleted: 1 } },
      { upsert: true }
    );
    await updateEcoPoints(req.user.id, points, { reason: 'game', courseId });
    res.json({ data: { awarded: points } });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to complete game' } });
  }
}

module.exports = { completeGame };


