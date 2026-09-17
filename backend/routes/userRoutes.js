const express = require('express');
const router = express.Router();
const { searchStudents } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); // all user routes require login

router.get('/students', authorize('teacher', 'admin'), searchStudents);

module.exports = router;