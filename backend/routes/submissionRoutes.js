const express = require('express');
const router = express.Router();
const {
  startExam,
  saveAnswer,
  submitExam,
  getSubmissionsByExam,
  getSubmissionById,
  getMySubmissions, 
} = require('../controllers/submissionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/start', authorize('student'), startExam);
router.put('/:id/answer', authorize('student'), saveAnswer);
router.put('/:id/submit', authorize('student'), submitExam);
router.get('/exam/:examId', authorize('teacher', 'admin'), getSubmissionsByExam);
router.get('/my', authorize('student'), getMySubmissions);
router.get('/:id', getSubmissionById);


module.exports = router;
