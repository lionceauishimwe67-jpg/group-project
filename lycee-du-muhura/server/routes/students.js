const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { studentController } = require('../controllers');

// Public routes
router.get('/', studentController.getAllStudents);
router.get('/:id', studentController.getStudent);

// Student login
router.post('/login', studentController.login);

// Protected routes (admin only)
router.post('/', authenticateToken, requireAdmin, studentController.createStudent);
router.put('/:id', authenticateToken, requireAdmin, studentController.updateStudent);
router.delete('/:id', authenticateToken, requireAdmin, studentController.deleteStudent);

// Student grades and attendance
router.get('/:id/grades', studentController.getStudentGrades);
router.get('/:id/attendance', studentController.getStudentAttendance);
router.post('/:id/attendance', authenticateToken, requireAdmin, studentController.markAttendance);

// Statistics
router.get('/stats/overview', authenticateToken, requireAdmin, studentController.getStudentStats);

module.exports = router;
