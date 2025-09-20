const Community = require('../models/Community');

// Get or create the single community instance
async function getCommunityInstance() {
  try {
    let community = await Community.findOne();
    if (!community) {
      community = await Community.create({
        name: "EcoLearn Community",
        description: "A place for students and teachers to connect"
      });
      console.log("Created new community instance");
    }
    return community;
  } catch (error) {
    console.error("Error getting community instance:", error);
    throw error;
  }
}

async function getCommunity(req, res) {
  try {
    const community = await getCommunityInstance();
    const populatedCommunity = await Community.findById(community._id)
      .populate('messages.author', 'name role email')
      .populate('messages.replies.author', 'name role email')
      .lean();
      
    // Sort messages by createdAt ascending
    if (populatedCommunity.messages) {
      populatedCommunity.messages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    }
    
    res.json({ data: populatedCommunity });
  } catch (err) {
    console.error('Error getting community:', err);
    res.status(500).json({ error: { message: 'Failed to get community messages' } });
  }
}

async function postMessage(req, res) {
  try {
    const { content } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: { message: 'Message content is required' } });
    }
    
    const community = await getCommunityInstance();
    const authorId = req.user.id || req.user._id;
    
    console.log("Posting message from user:", authorId, "Content:", content);
    
    // Add the new message
    community.messages.push({
      author: authorId,
      content: content.trim(),
      replies: []
    });
    
    // Save the community
    await community.save();
    console.log("Message saved successfully");
    
    // Get the fully populated community
    const populated = await Community.findById(community._id)
      .populate('messages.author', 'name role email')
      .populate('messages.replies.author', 'name role email')
      .lean();
      
    // Sort messages by createdAt ascending
    if (populated.messages) {
      populated.messages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    }
    
    res.json({ data: populated });
  } catch (err) {
    console.error('Error posting message:', err);
    res.status(500).json({ error: { message: 'Failed to post message', details: err.message } });
  }
}

async function postReply(req, res) {
  try {
    const { content } = req.body;
    const { messageId } = req.params;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: { message: 'Reply content is required' } });
    }
    
    const community = await getCommunityInstance();
    const authorId = req.user.id || req.user._id;
    
    // Find the message and add reply
    const message = community.messages.id(messageId);
    if (!message) {
      return res.status(404).json({ error: { message: 'Message not found' } });
    }
    
    message.replies.push({
      author: authorId,
      content: content.trim()
    });
    
    // Save the community
    await community.save();
    
    // Get the fully populated community
    const populated = await Community.findById(community._id)
      .populate('messages.author', 'name role email')
      .populate('messages.replies.author', 'name role email')
      .lean();
      
    // Sort messages by createdAt ascending
    if (populated.messages) {
      populated.messages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    }
    
    res.json({ data: populated });
  } catch (err) {
    console.error('Error posting reply:', err);
    res.status(500).json({ error: { message: 'Failed to post reply', details: err.message } });
  }
}

module.exports = { getCommunity, postMessage, postReply };