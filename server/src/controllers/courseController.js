const Joi = require('joi');
const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');

const createSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  imageUrl: Joi.string().uri().allow('', null),
  videoUrl: Joi.string().uri().allow('', null),
});

async function createCourse(req, res) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: { message: error.message } });
    const course = await Course.create({ ...value, teacher: req.user.id });
    res.status(201).json({ data: course });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to create course' } });
  }
}

async function listCourses(req, res) {
  try {
    const filter = {};
    if (req.query.teacher) filter.teacher = req.query.teacher;
    const courses = await Course.find(filter)
      .populate('teacher', 'name email')
      .populate('quizzes')
      .populate('assignments');
    res.json({ data: courses });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to list courses' } });
  }
}

async function getCourse(req, res) {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name')
      .populate('quizzes')
      .populate('assignments')
      .populate('students', 'name email');
    if (!course) return res.status(404).json({ error: { message: 'Not found' } });
    res.json({ data: course });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to get course' } });
  }
}

async function listMyCourses(req, res) {
  try {
    const courses = await Course.find({ teacher: req.user.id })
      .populate('students', 'name email ecoPoints')
      .sort({ createdAt: -1 });
    res.json({ data: courses });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to list teacher courses' } });
  }
}

async function enrollInCourse(req, res) {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: { message: 'Not found' } });
    if (course.students.includes(userId)) return res.json({ data: { enrolled: true } });
    course.students.push(userId);
    await course.save();
    await User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: courseId } });
    await Progress.findOneAndUpdate(
      { student: userId, course: courseId },
      { $setOnInsert: { materialsCompleted: 0, quizzesCompleted: 0, assignmentsSubmitted: 0, gamesCompleted: 0, progressPercent: 0 } },
      { upsert: true, new: true }
    );
    res.json({ data: { enrolled: true } });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to enroll' } });
  }
}

async function addMaterial(req, res) {
  try {
    const { type, title, description, url } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: { message: 'Not found' } });
    if (String(course.teacher) !== req.user.id) return res.status(403).json({ error: { message: 'Forbidden' } });
    course.materials.push({ type, title, description, url });
    await course.save();
    res.status(201).json({ data: course.materials[course.materials.length - 1] });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to add material' } });
  }
}

module.exports = { createCourse, listCourses, getCourse, enrollInCourse, addMaterial, listMyCourses };


