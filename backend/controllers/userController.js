const User = require('../models/User');

// @route  GET /api/users/students?search=someQuery
// @access Private (teacher, admin)
exports.searchStudents = async (req, res) => {
  try {
    const search = req.query.search || '';
    const query = {
      role: 'student',
      ...(search && {
        $or: [
          { studentId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
        ],
      }),
    };
    const students = await User.find(query)
      .select('name email studentId')
      .limit(20);
    res.status(200).json({ success: true, count: students.length, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};