const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // must have role: 'teacher' or 'admin'
      required: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    duration: {
      type: Number, // in minutes
      required: true,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    passingMarks: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    // Proctoring-specific settings
    proctoringSettings: {
      webcamRequired: { type: Boolean, default: true },
      fullscreenRequired: { type: Boolean, default: true },
      tabSwitchLimit: { type: Number, default: 3 }, // auto-submit after this many
      faceDetectionRequired: { type: Boolean, default: true },
      autoSubmitOnViolationLimit: { type: Boolean, default: true },
    },
    allowedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exam', examSchema);
