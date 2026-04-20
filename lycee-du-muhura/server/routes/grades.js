const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { gradeController } = require('../controllers');

// Protected routes
router.get('/', authenticateToken, gradeController.getAllGrades);
router.get('/stats', authenticateToken, requireAdmin, gradeController.getGradeStats);
router.get('/:id', authenticateToken, gradeController.getGrade);

// Admin only routes
router.post('/', authenticateToken, requireAdmin, gradeController.createGrade);
router.post('/bulk', authenticateToken, requireAdmin, gradeController.bulkCreateGrades);
router.put('/:id', authenticateToken, requireAdmin, gradeController.updateGrade);
router.delete('/:id', authenticateToken, requireAdmin, gradeController.deleteGrade);
router.post('/publish', authenticateToken, requireAdmin, gradeController.publishGrades);

module.exports = router;
