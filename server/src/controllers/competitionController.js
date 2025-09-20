const { Competition } = require('../models/Gamification');

async function createCompetition(req, res) {
  try {
    const { title, description, startDate, endDate } = req.body;
    const c = await Competition.create({ title, description, startDate, endDate });
    res.status(201).json({ data: c });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to create competition' } });
  }
}

async function listCompetitions(req, res) {
  try {
    const now = new Date();
    const list = await Competition.find({ endDate: { $gte: now } }).sort({ startDate: 1 });
    res.json({ data: list });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to list competitions' } });
  }
}

async function joinCompetition(req, res) {
  try {
    const { id } = req.params;
    const c = await Competition.findByIdAndUpdate(id, { $addToSet: { participants: req.user.id } }, { new: true });
    if (!c) return res.status(404).json({ error: { message: 'Not found' } });
    res.json({ data: c });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to join competition' } });
  }
}

module.exports = { createCompetition, listCompetitions, joinCompetition };


