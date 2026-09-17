const express = require('express');
const router = express.Router();
const {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // all exam routes require login

router.route('/')
  .post(authorize('teacher', 'admin'), createExam)
  .get(getExams);

router.route('/:id')
  .get(getExamById)
  .put(authorize('teacher', 'admin'), updateExam)
  .delete(authorize('teacher', 'admin'), deleteExam);

module.exports = router;
