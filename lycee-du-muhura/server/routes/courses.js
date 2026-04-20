const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { courseController } = require('../controllers');

// Public routes
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourse);

// Protected routes (admin only)
router.post('/', authenticateToken, requireAdmin, courseController.createCourse);
router.put('/:id', authenticateToken, requireAdmin, courseController.updateCourse);
router.delete('/:id', authenticateToken, requireAdmin, courseController.deleteCourse);

// Enrollment routes
router.post('/:id/enroll', authenticateToken, requireAdmin, courseController.enrollStudent);
router.post('/:id/remove-student', authenticateToken, requireAdmin, courseController.removeStudent);

module.exports = router;
