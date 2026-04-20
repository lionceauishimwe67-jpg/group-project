const express = require('express');
const { body, validationResult } = require('express-validator');
const Teacher = require('../models/Teacher');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/teachers
// @desc    Get all teachers
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate('userId', 'firstName lastName email phone')
      .populate('courses', 'courseName courseCode');
    res.json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/teachers/:id
// @desc    Get teacher by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone')
      .populate('courses', 'courseName courseCode');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/teachers
// @desc    Create a new teacher
// @access  Private/Admin
router.post('/', [
  auth,
  authorize('admin'),
  body('userId').isMongoId(),
  body('teacherId').trim().notEmpty(),
  body('department').trim().notEmpty(),
  body('qualification').trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, teacherId, department, subjects, qualification, experience } = req.body;

  try {
    const existingTeacher = await Teacher.findOne({ teacherId });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Teacher ID already exists' });
    }

    const teacher = new Teacher({
      userId,
      teacherId,
      department,
      subjects,
      qualification,
      experience
    });

    await teacher.save();
    await teacher.populate('userId', 'firstName lastName email');

    res.status(201).json(teacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/teachers/:id
// @desc    Update a teacher
// @access  Private/Admin
router.put('/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email');

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/teachers/:id
// @desc    Delete a teacher
// @access  Private/Admin
router.delete('/:id', [auth, authorize('admin')], async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    await Teacher.findByIdAndDelete(req.params.id);
    res.json({ message: 'Teacher removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
