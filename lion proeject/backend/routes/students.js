const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/students
// @desc    Get all students
// @access  Private/Admin/Teacher
router.get('/', auth, authorize('admin', 'teacher'), async (req, res) => {
  try {
    const students = await Student.find()
      .populate('userId', 'firstName lastName email phone')
      .populate('courses', 'courseName courseCode');
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/students/:id
// @desc    Get student by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone address')
      .populate('courses', 'courseName courseCode')
      .populate('grades');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Students can only view their own profile
    if (req.user.role === 'student' && student.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/students
// @desc    Create a new student
// @access  Private/Admin
router.post('/', [
  auth,
  authorize('admin'),
  body('userId').isMongoId(),
  body('studentId').trim().notEmpty(),
  body('grade').trim().notEmpty(),
  body('section').trim().notEmpty(),
  body('dateOfBirth').isISO8601(),
  body('gender').isIn(['male', 'female', 'other']),
  body('parentName').trim().notEmpty(),
  body('parentPhone').trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, studentId, grade, section, dateOfBirth, gender, parentName, parentPhone, parentEmail } = req.body;

  try {
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student ID already exists' });
    }

    const student = new Student({
      userId,
      studentId,
      grade,
      section,
      dateOfBirth,
      gender,
      parentName,
      parentPhone,
      parentEmail
    });

    await student.save();
    await student.populate('userId', 'firstName lastName email');

    res.status(201).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/students/:id
// @desc    Update a student
// @access  Private/Admin
router.put('/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete a student
// @access  Private/Admin
router.delete('/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
