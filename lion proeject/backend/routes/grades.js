const express = require('express');
const { body, validationResult } = require('express-validator');
const Grade = require('../models/Grade');
const Student = require('../models/Student');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/grades
// @desc    Get all grades (with filters)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { student, course, semester, academicYear } = req.query;
    let query = {};

    if (student) query.student = student;
    if (course) query.course = course;
    if (semester) query.semester = semester;
    if (academicYear) query.academicYear = academicYear;

    // Students can only see their own grades
    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user.id });
      if (student) query.student = student._id;
    }

    const grades = await Grade.find(query)
      .populate('student', 'studentId')
      .populate('course', 'courseName courseCode')
      .populate('teacher', 'teacherId');

    res.json(grades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/grades/student/:studentId
// @desc    Get grades for a specific student
// @access  Private
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Students can only view their own grades
    if (req.user.role === 'student' && student.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const grades = await Grade.find({ student: req.params.studentId })
      .populate('course', 'courseName courseCode')
      .populate('teacher', 'teacherId');

    res.json(grades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/grades
// @desc    Add a new grade
// @access  Private/Teacher/Admin
router.post('/', [
  auth,
  authorize('teacher', 'admin'),
  body('student').isMongoId(),
  body('course').isMongoId(),
  body('examType').isIn(['quiz', 'midterm', 'final', 'assignment', 'project']),
  body('score').isFloat({ min: 0, max: 100 }),
  body('semester').trim().notEmpty(),
  body('academicYear').trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const teacherId = req.user.role === 'teacher' 
      ? req.user.teacherProfile 
      : req.body.teacher;

    const grade = new Grade({
      ...req.body,
      teacher: req.user.id
    });

    await grade.save();
    await grade.populate('student', 'studentId');
    await grade.populate('course', 'courseName courseCode');

    res.status(201).json(grade);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/grades/:id
// @desc    Update a grade
// @access  Private/Teacher/Admin
router.put('/:id', [auth, authorize('teacher', 'admin')], async (req, res) => {
  try {
    const grade = await Grade.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('student', 'studentId')
     .populate('course', 'courseName courseCode');

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    res.json(grade);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/grades/:id
// @desc    Delete a grade
// @access  Private/Admin
router.delete('/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);

    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    await Grade.findByIdAndDelete(req.params.id);
    res.json({ message: 'Grade removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/grades/stats/:studentId
// @desc    Get grade statistics for a student
// @access  Private
router.get('/stats/:studentId', auth, async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.params.studentId });
    
    if (grades.length === 0) {
      return res.json({ message: 'No grades found' });
    }

    const totalScore = grades.reduce((sum, grade) => sum + grade.score, 0);
    const average = totalScore / grades.length;
    const highest = Math.max(...grades.map(g => g.score));
    const lowest = Math.min(...grades.map(g => g.score));

    res.json({
      totalGrades: grades.length,
      average: average.toFixed(2),
      highest,
      lowest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
