const express = require('express');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Grade = require('../models/Grade');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', [auth, authorize('admin')], async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalUsers = await User.countDocuments();
    const activeCourses = await Course.countDocuments({ isActive: true });

    // Recent grades (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentGrades = await Grade.countDocuments({ date: { $gte: thirtyDaysAgo } });

    // Average grade statistics
    const grades = await Grade.find();
    const averageScore = grades.length > 0 
      ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(2)
      : 0;

    res.json({
      totalStudents,
      totalTeachers,
      totalCourses,
      totalUsers,
      activeCourses,
      recentGrades,
      averageScore
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/recent-activity
// @desc    Get recent activity
// @access  Private/Admin
router.get('/recent-activity', [auth, authorize('admin')], async (req, res) => {
  try {
    const recentGrades = await Grade.find()
      .sort({ date: -1 })
      .limit(10)
      .populate('student', 'studentId')
      .populate('course', 'courseName');

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName role createdAt');

    res.json({
      recentGrades,
      recentUsers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/grade-distribution
// @desc    Get grade distribution for charts
// @access  Private/Admin
router.get('/grade-distribution', [auth, authorize('admin')], async (req, res) => {
  try {
    const grades = await Grade.find();
    
    const distribution = {
      'A (90-100)': 0,
      'B (80-89)': 0,
      'C (70-79)': 0,
      'D (60-69)': 0,
      'F (Below 60)': 0
    };

    grades.forEach(grade => {
      const score = grade.score;
      if (score >= 90) distribution['A (90-100)']++;
      else if (score >= 80) distribution['B (80-89)']++;
      else if (score >= 70) distribution['C (70-79)']++;
      else if (score >= 60) distribution['D (60-69)']++;
      else distribution['F (Below 60)']++;
    });

    res.json(distribution);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/student-stats
// @desc    Get student dashboard data
// @access  Private/Student
router.get('/student-stats', [auth, authorize('student')], async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const grades = await Grade.find({ student: student._id })
      .populate('course', 'courseName courseCode');

    const courses = await Course.find({ students: student._id });

    const averageScore = grades.length > 0
      ? (grades.reduce((sum, g) => sum + g.score, 0) / grades.length).toFixed(2)
      : 0;

    res.json({
      studentInfo: student,
      grades,
      courses,
      averageScore,
      totalCourses: courses.length,
      totalGrades: grades.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/teacher-stats
// @desc    Get teacher dashboard data
// @access  Private/Teacher
router.get('/teacher-stats', [auth, authorize('teacher')], async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher profile not found' });
    }

    const courses = await Course.find({ teacher: teacher._id });
    const courseIds = courses.map(c => c._id);

    const grades = await Grade.find({ course: { $in: courseIds } })
      .populate('student', 'studentId')
      .populate('course', 'courseName');

    const totalStudents = courses.reduce((sum, course) => sum + course.students.length, 0);

    res.json({
      teacherInfo: teacher,
      courses,
      grades,
      totalCourses: courses.length,
      totalStudents,
      totalGrades: grades.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
