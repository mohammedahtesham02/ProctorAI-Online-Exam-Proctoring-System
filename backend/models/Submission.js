const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    answerGiven: {
      type: String,
      default: '',
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    marksAwarded: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
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
    answers: [answerSchema],
    score: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    submitTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'auto-submitted', 'terminated'],
      default: 'in-progress',
    },
    // Proctoring summary (denormalized for fast dashboard reads;
    // full detail lives in ViolationLog collection)
    violationCount: {
      type: Number,
      default: 0,
    },
    cheatingPercentage: {
      type: Number, // 0-100, calculated from violation severity/frequency
      default: 0,
      min: 0,
      max: 100,
    },
    flaggedForReview: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// A student should only have one submission per exam
submissionSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
