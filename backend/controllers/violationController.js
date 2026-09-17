const ViolationLog = require('../models/ViolationLog');
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');
const { autoSubmitExam } = require('./submissionController');

const SEVERITY_WEIGHTS = { low: 5, medium: 10, high: 20 };

// @route  POST /api/violations
// @access Private (student - called by frontend proctoring code in real time)
exports.logViolation = async (req, res) => {
  try {
    const { examId, submissionId, violationType, severity, screenshotUrl, notes } = req.body;

    const violation = await ViolationLog.create({
      exam: examId,
      student: req.user._id,
      submission: submissionId,
      violationType,
      severity: severity || 'medium',
      screenshotUrl,
      notes,
    });

    // update running violation count + cheating percentage on the submission
    const allViolations = await ViolationLog.find({ submission: submissionId });
    const rawScore = allViolations.reduce((sum, v) => sum + (SEVERITY_WEIGHTS[v.severity] || 10), 0);
    const cheatingPercentage = Math.min(100, rawScore);

    const submission = await Submission.findByIdAndUpdate(
      submissionId,
      {
        violationCount: allViolations.length,
        cheatingPercentage,
        flaggedForReview: cheatingPercentage >= 50, // flag once it crosses halfway
      },
      { new: true }
    );

    // check exam's auto-submit rule
    const exam = await Exam.findById(examId);
    let autoSubmitted = false;

    if (
      exam?.proctoringSettings?.autoSubmitOnViolationLimit &&
      allViolations.length >= (exam.proctoringSettings.tabSwitchLimit || 3)
    ) {
      await autoSubmitExam(submissionId);
      autoSubmitted = true;
    }

    res.status(201).json({
      success: true,
      violation,
      violationCount: allViolations.length,
      cheatingPercentage,
      autoSubmitted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/violations/submission/:submissionId
// @access Private (teacher, admin, or the student who owns it)
exports.getViolationsBySubmission = async (req, res) => {
  try {
    const violations = await ViolationLog.find({ submission: req.params.submissionId }).sort({
      timestamp: 1,
    });
    res.status(200).json({ success: true, count: violations.length, violations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/violations/exam/:examId
// @access Private (teacher, admin) - overview of all violations for an exam
exports.getViolationsByExam = async (req, res) => {
  try {
    const violations = await ViolationLog.find({ exam: req.params.examId })
      .populate('student', 'name studentId')
      .sort({ timestamp: -1 });
    res.status(200).json({ success: true, count: violations.length, violations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
