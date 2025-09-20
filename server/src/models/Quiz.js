const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema(
  {
    prompt: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true },
    points: { type: Number, default: 10 },
  },
  { _id: false }
);

const QuizSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true },
    questions: [QuestionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quiz', QuizSchema);


