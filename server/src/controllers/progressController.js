const Progress = require('../models/Progress');
const Course = require('../models/Course');
const { updateEcoPoints } = require('../services/gamificationService');

async function getMyProgress(req, res) {
  try {
    const list = await Progress.find({ student: req.user.id }).populate('course', 'title');
    res.json({ data: list });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to get progress' } });
  }
}

async function incrementMaterial(req, res) {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select('materials');
    if (!course) return res.status(404).json({ error: { message: 'Course not found' } });
    const totalMaterials = (course.materials || []).length || 1;
    const updated = await Progress.findOneAndUpdate(
      { student: req.user.id, course: courseId },
      { $inc: { materialsCompleted: 1 } },
      { new: true, upsert: true }
    );
    const percent = Math.min(100, Math.round(((updated.materialsCompleted + updated.quizzesCompleted + updated.assignmentsSubmitted + updated.gamesCompleted) / (totalMaterials + 3)) * 100));
    updated.progressPercent = percent;
    await updated.save();
    await updateEcoPoints(req.user.id, 10, { reason: 'content', courseId });
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to update progress' } });
  }
}

module.exports = { getMyProgress, incrementMaterial };
