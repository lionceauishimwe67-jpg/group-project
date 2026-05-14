import { Router } from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats,
  recordAttendance
} from '../controllers/studentController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all students (admin only)
router.get('/', authenticateToken, requireAdmin, getAllStudents);

// Get student stats (admin only)
router.get('/stats', authenticateToken, requireAdmin, getStudentStats);

// Get student by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, getStudentById);

// Create student (admin only)
router.post('/', authenticateToken, requireAdmin, createStudent);

// Update student (admin only)
router.put('/:id', authenticateToken, requireAdmin, updateStudent);

// Delete student (admin only)
router.delete('/:id', authenticateToken, requireAdmin, deleteStudent);

// Record attendance (admin or teacher)
router.post('/attendance', authenticateToken, recordAttendance);

export default router;
