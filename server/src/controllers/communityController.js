const Thread = require('../models/Community');
const { broadcast } = require('../services/realtime');

async function createThread(req, res) {
  try {
    const { title, course } = req.body;
    const thread = await Thread.create({ title, course, messages: [] });
    try { broadcast('community:thread', { threadId: thread._id, title: thread.title }); } catch (e) {}
    res.status(201).json({ data: thread });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to create thread' } });
  }
}

async function listThreads(req, res) {
  try {
    const { course } = req.query;
    const filter = course ? { course } : {};
    const threads = await Thread.find(filter)
      .sort({ updatedAt: -1 })
      .lean();
    // Ensure messages are sorted and authors are populated for summary view is heavy; keep ids here
    res.json({ data: threads });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to list threads' } });
  }
}

async function getThread(req, res) {
  try {
    const { threadId } = req.params;
    const thread = await Thread.findById(threadId)
      .populate('messages.author', 'name email')
      .lean();
    if (!thread) return res.status(404).json({ error: { message: 'Not found' } });
    // Sort messages by createdAt ascending
    thread.messages = (thread.messages || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    res.json({ data: thread });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to get thread' } });
  }
}

async function postMessage(req, res) {
  try {
    const { content } = req.body;
    const { threadId } = req.params;
    await Thread.findByIdAndUpdate(
      threadId,
      { $push: { messages: { author: req.user.id, content } } },
      { new: true }
    );
    const populated = await Thread.findById(threadId).populate('messages.author','name email').lean();
    if (!populated) return res.status(404).json({ error: { message: 'Not found' } });
    populated.messages = (populated.messages || []).sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));
    try { broadcast('community:message', { threadId, content, author: req.user.id }); } catch (e) {}
    res.json({ data: populated });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to post message' } });
  }
}

module.exports = { createThread, listThreads, getThread, postMessage };


