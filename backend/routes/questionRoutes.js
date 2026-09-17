const express = require('express');
const router = express.Router();
const {
  addQuestion,
  getQuestionsByExam,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/questionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('teacher', 'admin'), addQuestion);
router.get('/exam/:examId', getQuestionsByExam);
router.put('/:id', authorize('teacher', 'admin'), updateQuestion);
router.delete('/:id', authorize('teacher', 'admin'), deleteQuestion);

module.exports = router;
