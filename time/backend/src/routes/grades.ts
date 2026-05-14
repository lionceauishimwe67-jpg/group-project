import { Router } from 'express';
import {
  getAllGrades,
  getStudentGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  getGradeStats
} from '../controllers/gradeController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all grades (admin only)
router.get('/', authenticateToken, requireAdmin, getAllGrades);

// Get grade stats (admin only)
router.get('/stats', authenticateToken, requireAdmin, getGradeStats);

// Get grades for a specific student (admin or self if implemented)
router.get('/student/:studentId', authenticateToken, requireAdmin, getStudentGrades);

// Create grade (admin or teacher)
router.post('/', authenticateToken, createGrade);

// Update grade (admin or teacher)
router.put('/:id', authenticateToken, updateGrade);

// Delete grade (admin only)
router.delete('/:id', authenticateToken, requireAdmin, deleteGrade);

export default router;
