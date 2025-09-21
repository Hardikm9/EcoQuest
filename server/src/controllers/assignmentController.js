const Joi = require('joi');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const { updateEcoPoints } = require('../services/gamificationService');

const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  dueDate: Joi.date().optional(),
  points: Joi.number().min(0).default(20),
});

async function createAssignment(req, res) {
  try {
    const { courseId } = req.params;
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: { message: error.message } });
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: { message: 'Course not found' } });
    if (String(course.teacher) !== req.user.id) return res.status(403).json({ error: { message: 'Forbidden' } });
    const assignment = await Assignment.create({ ...value, course: course._id });
    course.assignments.push(assignment._id);
    await course.save();
    res.status(201).json({ data: assignment });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to create assignment' } });
  }
}

const submitSchema = Joi.object({ contentUrl: Joi.string().uri().required() });

async function submitAssignment(req, res) {
  try {
    const { assignmentId } = req.params;
    const { value, error } = submitSchema.validate(req.body);
    if (error) return res.status(400).json({ error: { message: error.message } });
    const assignment = await Assignment.findByIdAndUpdate(
      assignmentId,
      { $push: { submissions: { student: req.user.id, contentUrl: value.contentUrl } } },
      { new: true }
    );
    if (!assignment) return res.status(404).json({ error: { message: 'Not found' } });
    await Progress.findOneAndUpdate(
      { student: req.user.id, course: assignment.course },
      { $inc: { assignmentsSubmitted: 1 } },
      { upsert: true }
    );
    await updateEcoPoints(req.user.id, 10, { reason: 'assignment', assignmentId });
    res.json({ data: assignment });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to submit assignment' } });
  }
}

const gradeSchema = Joi.object({ grade: Joi.number().min(0).max(100).required(), feedback: Joi.string().allow('') });

async function gradeSubmission(req, res) {
  try {
    const { assignmentId, submissionId } = req.params;
    const { value, error } = gradeSchema.validate(req.body);
    if (error) return res.status(400).json({ error: { message: error.message } });
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ error: { message: 'Not found' } });
    // Only course teacher can grade
    const course = await Course.findById(assignment.course);
    if (String(course.teacher) !== req.user.id) return res.status(403).json({ error: { message: 'Forbidden' } });
    const sub = assignment.submissions.id(submissionId);
    if (!sub) return res.status(404).json({ error: { message: 'Submission not found' } });
    sub.grade = value.grade;
    sub.feedback = value.feedback;
    sub.gradedAt = new Date();
    await assignment.save();
    // Award points based on grade percentage of assignment points
    const earned = Math.round((value.grade / 100) * (assignment.points || 20));
    await updateEcoPoints(sub.student, earned, { reason: 'assignment_graded', assignmentId });
    res.json({ data: sub });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to grade submission' } });
  }
}

async function getAssignment(req, res) {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId).populate('submissions.student', 'name email');
    if (!assignment) return res.status(404).json({ error: { message: 'Not found' } });
    const course = await Course.findById(assignment.course).select('teacher');
    if (String(course.teacher) !== req.user.id) return res.status(403).json({ error: { message: 'Forbidden' } });
    res.json({ data: assignment });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to get assignment' } });
  }
}

module.exports = { createAssignment, submitAssignment, gradeSubmission, getAssignment };
