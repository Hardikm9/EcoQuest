const User = require('../models/User');
const { LeaderboardEntry } = require('../models/Gamification');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const Teacher = require('../models/Teacher');
const Notification = require('../models/Notification');
const { emitToUser } = require('../services/realtime');
const WinnerAnnouncement = require('../models/Winner');

async function approveTeacher(req, res) {
  try {
    const { teacherId, isApproved } = req.body;
    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      { $set: { isApproved: !!isApproved } },
      { new: true }
    ).populate('user', 'name email');
    if (!teacher) return res.status(404).json({ error: { message: 'Teacher not found' } });
    res.json({ data: teacher });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to update approval' } });
  }
}

async function approveCourse(req, res) {
    try {
      const { courseId, isApproved } = req.body;
      const course = await Course.findByIdAndUpdate(
        courseId,
        { $set: { isApproved: !!isApproved } },
        { new: true }
      );
      if (!course) return res.status(404).json({ error: { message: 'Course not found' } });
      res.json({ data: course });
    } catch (err) {
      res.status(500).json({ error: { message: 'Failed to update approval' } });
    }
}

async function listUsers(req, res) {
  try {
    const users = await User.find().select('name email role ecoPoints');
    res.json({ data: users });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to list users' } });
  }
}

async function getLeaderboard(req, res) {
  try {
    const top = await LeaderboardEntry.find().sort({ rank: 1 }).limit(100).populate('student', 'name ecoPoints');
    res.json({ data: top });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to get leaderboard' } });
  }
}

async function listTeachersDetailed(req, res) {
  try {
    const teacherDocs = await Teacher.find().populate('user','name email');
    const result = [];
    for (const t of teacherDocs) {
      const courses = await Course.find({ teacher: t.user._id }).select('title materials quizzes assignments students');
      result.push({
        teacher: {
          id: t._id,
          user: t.user,
          isApproved: t.isApproved,
          qualification: t.qualification,
          contact: t.contact,
        },
        courses: courses.map(c => ({
          _id: c._id,
          title: c.title,
          materialsCount: (c.materials||[]).length,
          quizzesCount: (c.quizzes||[]).length,
          assignmentsCount: (c.assignments||[]).length,
          studentsCount: (c.students||[]).length,
        })),
      });
    }
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to list teachers' } });
  }
}

async function listStudentsDetailed(req, res) {
  try {
    const students = await User.find({ role: 'student' }).select('name email ecoPoints badges enrolledCourses');
    const result = [];
    for (const s of students) {
      const progress = await Progress.find({ student: s._id }).select('course materialsCompleted quizzesCompleted assignmentsSubmitted gamesCompleted progressPercent').populate('course','title');
      result.push({
        student: s,
        enrolledCourses: s.enrolledCourses || [],
        badgesCount: (s.badges||[]).length,
        progress,
      });
    }
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to list students' } });
  }
}

async function broadcastNotification(req, res) {
  try {
    const { audience, title, body } = req.body; // audience: 'teachers' | 'students' | 'all'
    if (!title || !body) return res.status(400).json({ error: { message: 'title and body are required' } });
    let filter = {};
    if (audience === 'teachers') filter = { role: 'teacher' };
    else if (audience === 'students') filter = { role: 'student' };
    else filter = { role: { $in: ['teacher', 'student'] } };

    const recipients = await User.find(filter).select('_id');
    if (!recipients.length) return res.json({ data: { sent: 0 } });

    const docs = recipients.map((u) => ({ recipient: u._id, type: 'system', title, body, meta: { audience } }));
    const created = await Notification.insertMany(docs);
    // Emit to each user in background-ish loop
    for (const n of created) {
      try { emitToUser(n.recipient, 'notification:new', n); } catch (e) {}
    }
    res.status(201).json({ data: { sent: created.length } });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to broadcast' } });
  }
}

async function listApprovedTeachers(req, res) {
  try {
    const docs = await Teacher.find({ isApproved: true }).populate('user','name email');
    const result = [];
    for (const t of docs) {
      const courseCount = await Course.countDocuments({ teacher: t.user._id });
      result.push({ id: t._id, name: t.user.name, email: t.user.email, courseCount });
    }
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to list approved teachers' } });
  }
}

async function listAllContent(req, res) {
  try {
    const courses = await Course.find().populate('teacher','name email');
    const result = courses.map(c => ({
      id: c._id,
      title: c.title,
      teacher: c.teacher,
      materialsCount: (c.materials||[]).length,
      quizzesCount: (c.quizzes||[]).length,
      assignmentsCount: (c.assignments||[]).length,
      isApproved: c.isApproved,
    }));
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to list content' } });
  }
}

async function configureLeaderboard(req, res) {
  try {
    const { winners, minPoints, period } = req.body;
    const limit = Math.max(1, Number(winners) || 1);
    const min = Math.max(0, Number(minPoints) || 0);
    const per = period === 'monthly' ? 'monthly' : 'weekly';
    // Pick top students by ecoPoints
    const candidates = await User.find({ role: 'student', ecoPoints: { $gte: min } })
      .select('_id name ecoPoints')
      .sort({ ecoPoints: -1 })
      .limit(limit);
    const winnerIds = candidates.map(c => c._id);
    const doc = await WinnerAnnouncement.create({ period: per, minPoints: min, winnersCount: limit, winners: winnerIds, active: true });
    res.status(201).json({ data: { id: doc._id, winners: winnerIds } });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to configure leaderboard' } });
  }
}

async function getLatestWinners(req, res) {
  try {
    const latest = await WinnerAnnouncement.findOne({ active: true }).sort({ createdAt: -1 }).populate('winners','name email ecoPoints');
    res.json({ data: latest || null });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to fetch winners' } });
  }
}

module.exports = { approveTeacher, listUsers, getLeaderboard, listTeachersDetailed, listStudentsDetailed, broadcastNotification, listApprovedTeachers, listAllContent, configureLeaderboard, getLatestWinners, approveCourse };
