const Joi = require('joi');
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');
const { updateEcoPoints } = require('../services/gamificationService');

const quizSchema = Joi.object({
  title: Joi.string().required(),
  questions: Joi.array().items(
    Joi.object({ prompt: Joi.string().required(), options: Joi.array().items(Joi.string().required()).min(2).required(), correctIndex: Joi.number().required(), points: Joi.number().min(0).default(10) })
  ).min(1).required(),
});

async function createQuiz(req, res) {
  try {
    const { value, error } = quizSchema.validate(req.body);
    if (error) return res.status(400).json({ error: { message: error.message } });
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: { message: 'Course not found' } });
    if (String(course.teacher) !== req.user.id) return res.status(403).json({ error: { message: 'Forbidden' } });
    const quiz = await Quiz.create({ ...value, course: course._id });
    course.quizzes.push(quiz._id);
    await course.save();
    res.status(201).json({ data: quiz });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to create quiz' } });
  }
}

const submitSchema = Joi.object({
  answers: Joi.array().items(Joi.number().required()).required(),
});

async function submitQuiz(req, res) {
  try {
    const { value, error } = submitSchema.validate(req.body);
    if (error) return res.status(400).json({ error: { message: error.message } });
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: { message: 'Quiz not found' } });
    const answers = value.answers;
    let score = 0;
    let correctAnswers = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) {
        score += q.points || 0;
        correctAnswers++;
      }
    });
    // Update progress and ecoPoints
    await Progress.findOneAndUpdate(
      { student: req.user.id, course: quiz.course },
      { $inc: { quizzesCompleted: 1 }, $set: {} },
      { upsert: true }
    );
    await updateEcoPoints(req.user.id, correctAnswers * 10, { reason: 'quiz', quizId: quiz._id });
    res.json({ data: { score } });
  } catch (err) {
    res.status(500).json({ error: { message: 'Failed to submit quiz' } });
  }
}

module.exports = { createQuiz, submitQuiz };
