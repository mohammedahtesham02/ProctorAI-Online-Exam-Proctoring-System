const Exam = require('../models/Exam');
const Question = require('../models/Question');

// @route  POST /api/exams
// @access Private (teacher, admin)
exports.createExam = async (req, res) => {
  try {
    const exam = await Exam.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/exams
// @access Private (all roles - students see only allowed/scheduled exams)
exports.getExams = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      // students only see exams they're allowed to take
     query = { allowedStudents: req.user._id, status: { $in: ['scheduled', 'ongoing'] } };
    } else if (req.user.role === 'teacher') {
      // teachers see exams they created
      query = { createdBy: req.user._id };
    }
    // admin sees everything (empty query)

    const exams = await Exam.find(query).populate('createdBy', 'name email');
    res.status(200).json({ success: true, count: exams.length, exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/exams/:id
// @access Private
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('questions');
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    res.status(200).json({ success: true, exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  PUT /api/exams/:id
// @access Private (teacher who owns it, or admin)
exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (req.user.role === 'teacher' && exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this exam' });
    }

    const updated = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, exam: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  DELETE /api/exams/:id
// @access Private (teacher who owns it, or admin)
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    if (req.user.role === 'teacher' && exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this exam' });
    }

    await Question.deleteMany({ exam: exam._id }); // clean up related questions
    await exam.deleteOne();

    res.status(200).json({ success: true, message: 'Exam deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
