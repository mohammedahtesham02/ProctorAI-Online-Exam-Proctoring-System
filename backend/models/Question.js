const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    questionType: {
      type: String,
      enum: ['mcq', 'true-false', 'short-answer'],
      default: 'mcq',
    },
    options: {
      type: [String], // e.g. ["Option A", "Option B", "Option C", "Option D"]
      validate: {
        validator: function (val) {
          // options only required for mcq / true-false types
          if (this.questionType === 'short-answer') return true;
          return val && val.length >= 2;
        },
        message: 'MCQ/True-False questions need at least 2 options',
      },
    },
    correctAnswer: {
      type: String, // stores the correct option text or short answer
      required: true,
    },
    marks: {
      type: Number,
      default: 1,
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);
