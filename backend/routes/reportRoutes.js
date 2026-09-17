const express = require('express');
const router = express.Router();
const {
  generateReport,
  emailReport,
  getReportsByExam,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('teacher', 'admin'));

router.post('/generate/:submissionId', generateReport);
router.post('/:id/email', emailReport);
router.get('/exam/:examId', getReportsByExam);

module.exports = router;
