const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { eventController } = require('../controllers');

// Public routes
router.get('/', eventController.getAllEvents);
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/:id', eventController.getEvent);

// Student specific routes
router.get('/student/:studentId', authenticateToken, eventController.getStudentEvents);

// Protected routes (admin/teacher)
router.post('/', authenticateToken, requireAdmin, eventController.createEvent);
router.put('/:id', authenticateToken, requireAdmin, eventController.updateEvent);
router.delete('/:id', authenticateToken, requireAdmin, eventController.deleteEvent);
router.post('/:id/cancel', authenticateToken, requireAdmin, eventController.cancelEvent);
router.post('/:id/attendance', authenticateToken, requireAdmin, eventController.markAttendance);

module.exports = router;
