const express = require('express');
const router = express.Router();
const {
  logViolation,
  getViolationsBySubmission,
  getViolationsByExam,
} = require('../controllers/violationController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('student'), logViolation);
router.get('/submission/:submissionId', getViolationsBySubmission);
router.get('/exam/:examId', authorize('teacher', 'admin'), getViolationsByExam);

module.exports = router;
