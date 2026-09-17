const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    submission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
    },
    summary: {
      totalQuestions: Number,
      correctAnswers: Number,
      score: Number,
      totalMarks: Number,
      violationCount: Number,
      cheatingPercentage: Number,
      finalStatus: {
        type: String,
        enum: ['clean', 'flagged', 'disqualified'],
        default: 'clean',
      },
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
    },
    recipientEmails: [
      {
        type: String,
      },
    ],
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // teacher/admin who triggered report generation
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
