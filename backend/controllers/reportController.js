const Report = require('../models/Report');
const Submission = require('../models/Submission');
const ViolationLog = require('../models/ViolationLog');
const Question = require('../models/Question');
const sendEmail = require('../utils/sendEmail');

// @route  POST /api/reports/generate/:submissionId
// @access Private (teacher, admin)
exports.generateReport = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId)
      .populate('student', 'name email studentId')
      .populate('exam', 'title totalMarks');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    const totalQuestions = submission.answers.length;
    const correctAnswers = submission.answers.filter((a) => a.isCorrect).length;

    let finalStatus = 'clean';
    if (submission.cheatingPercentage >= 50) finalStatus = 'disqualified';
    else if (submission.cheatingPercentage >= 20) finalStatus = 'flagged';

    const report = await Report.create({
      exam: submission.exam._id,
      student: submission.student._id,
      submission: submission._id,
      summary: {
        totalQuestions,
        correctAnswers,
        score: submission.score,
        totalMarks: submission.exam.totalMarks,
        violationCount: submission.violationCount,
        cheatingPercentage: submission.cheatingPercentage,
        finalStatus,
      },
      generatedBy: req.user._id,
    });

    res.status(201).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  POST /api/reports/:id/email
// @access Private (teacher, admin)
exports.emailReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('student', 'name email')
      .populate('exam', 'title');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const { recipientEmails } = req.body; // e.g. [teacher email, admin email]
    const recipients = recipientEmails && recipientEmails.length ? recipientEmails : [report.student.email];

    const html = `
      <h2>Exam Report: ${report.exam.title}</h2>
      <p><strong>Student:</strong> ${report.student.name}</p>
      <p><strong>Score:</strong> ${report.summary.score} / ${report.summary.totalMarks}</p>
      <p><strong>Correct Answers:</strong> ${report.summary.correctAnswers} / ${report.summary.totalQuestions}</p>
      <p><strong>Violations Detected:</strong> ${report.summary.violationCount}</p>
      <p><strong>Cheating Percentage:</strong> ${report.summary.cheatingPercentage}%</p>
      <p><strong>Status:</strong> ${report.summary.finalStatus.toUpperCase()}</p>
    `;

    await sendEmail({
      to: recipients.join(','),
      subject: `Exam Report - ${report.exam.title}`,
      html,
    });

    report.emailSent = true;
    report.emailSentAt = new Date();
    report.recipientEmails = recipients;
    await report.save();

    res.status(200).json({ success: true, message: 'Report emailed successfully', report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/reports/exam/:examId
// @access Private (teacher, admin)
exports.getReportsByExam = async (req, res) => {
  try {
    const reports = await Report.find({ exam: req.params.examId }).populate('student', 'name email studentId');
    res.status(200).json({ success: true, count: reports.length, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
