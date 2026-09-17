const Submission = require('../models/Submission');
const Question = require('../models/Question');
const Exam = require('../models/Exam');

// @route  POST /api/submissions/start
// @access Private (student)
// Creates the submission doc when a student begins an exam
exports.startExam = async (req, res) => {
  try {
    const { examId } = req.body;

    const existing = await Submission.findOne({ exam: examId, student: req.user._id });
    if (existing) {
      return res.status(200).json({ success: true, submission: existing, message: 'Resuming existing attempt' });
    }

    const submission = await Submission.create({
      exam: examId,
      student: req.user._id,
      startTime: new Date(),
      status: 'in-progress',
    });

    res.status(201).json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  PUT /api/submissions/:id/answer
// @access Private (student)
// Save/update a single answer as the student progresses (autosave)
exports.saveAnswer = async (req, res) => {
  try {
    const { questionId, answerGiven } = req.body;
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    if (submission.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your submission' });
    }
    if (submission.status !== 'in-progress') {
      return res.status(400).json({ success: false, message: 'Exam already submitted' });
    }

    const existingAnswerIndex = submission.answers.findIndex(
      (a) => a.question.toString() === questionId
    );

    if (existingAnswerIndex > -1) {
      submission.answers[existingAnswerIndex].answerGiven = answerGiven;
    } else {
      submission.answers.push({ question: questionId, answerGiven });
    }

    await submission.save();
    res.status(200).json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Shared scoring logic used by both manual and auto submit
const scoreSubmission = async (submission) => {
  const questions = await Question.find({ _id: { $in: submission.answers.map((a) => a.question) } });
  let score = 0;

  submission.answers = submission.answers.map((ans) => {
    const question = questions.find((q) => q._id.toString() === ans.question.toString());
    if (!question) return ans;

    const isCorrect = question.correctAnswer.trim().toLowerCase() === (ans.answerGiven || '').trim().toLowerCase();
    const marksAwarded = isCorrect ? question.marks : 0;
    score += marksAwarded;

    return { ...ans.toObject(), isCorrect, marksAwarded };
  });

  submission.score = score;
  return submission;
};

// @route  PUT /api/submissions/:id/submit
// @access Private (student)
exports.submitExam = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    if (submission.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your submission' });
    }

    await scoreSubmission(submission);
    submission.status = 'submitted';
    submission.submitTime = new Date();
    await submission.save();

    res.status(200).json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Called internally (e.g. by violation controller) when a student
// exceeds the allowed violation limit for an exam
exports.autoSubmitExam = async (submissionId) => {
  const submission = await Submission.findById(submissionId);
  if (!submission || submission.status !== 'in-progress') return submission;

  await scoreSubmission(submission);
  submission.status = 'auto-submitted';
  submission.submitTime = new Date();
  submission.flaggedForReview = true;
  await submission.save();

  return submission;
};

// @route  GET /api/submissions/exam/:examId
// @access Private (teacher, admin) - view all submissions for an exam
exports.getSubmissionsByExam = async (req, res) => {
  try {
    const submissions = await Submission.find({ exam: req.params.examId }).populate(
      'student',
      'name email studentId'
    );
    res.status(200).json({ success: true, count: submissions.length, submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/submissions/:id
// @access Private
exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('student', 'name email studentId')
      .populate('exam', 'title subject totalMarks');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    res.status(200).json({ success: true, submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
