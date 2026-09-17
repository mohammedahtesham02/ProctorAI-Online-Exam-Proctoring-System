const Question = require('../models/Question');
const Exam = require('../models/Exam');

// @route  POST /api/questions
// @access Private (teacher, admin)
exports.addQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);

    // link question to exam and update total marks
    const exam = await Exam.findById(req.body.exam);
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    exam.questions.push(question._id);
    exam.totalMarks += question.marks;
    await exam.save();

    res.status(201).json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/questions/exam/:examId
// @access Private
// NOTE: for students taking the exam, strip correctAnswer before sending!
exports.getQuestionsByExam = async (req, res) => {
  try {
    const questions = await Question.find({ exam: req.params.examId });

    if (req.user.role === 'student') {
      const safeQuestions = questions.map((q) => {
        const obj = q.toObject();
        delete obj.correctAnswer;
        return obj;
      });
      return res.status(200).json({ success: true, questions: safeQuestions });
    }

    res.status(200).json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  PUT /api/questions/:id
// @access Private (teacher, admin)
exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.status(200).json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  DELETE /api/questions/:id
// @access Private (teacher, admin)
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    await Exam.findByIdAndUpdate(question.exam, {
      $pull: { questions: question._id },
      $inc: { totalMarks: -question.marks },
    });

    await question.deleteOne();
    res.status(200).json({ success: true, message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
