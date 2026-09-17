const mongoose = require('mongoose');

const violationLogSchema = new mongoose.Schema(
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
    violationType: {
      type: String,
      enum: [
        'tab-switch',
        'fullscreen-exit',
        'no-face-detected',
        'multiple-faces-detected',
        'copy-paste-attempt',
        'right-click',
        'window-blur',
        'noise-detected',
        'device-disconnected',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    screenshotUrl: {
      type: String, // optional captured frame at time of violation
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for fast lookups when calculating cheating % per submission
violationLogSchema.index({ submission: 1 });
violationLogSchema.index({ exam: 1, student: 1 });

module.exports = mongoose.model('ViolationLog', violationLogSchema);
