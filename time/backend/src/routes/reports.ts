import { Router } from 'express';
import {
  getDailySummary,
  getMissedLessons,
  getTeacherAttendance
} from '../controllers/reportController';
import { authenticateToken, requireManager } from '../middleware/auth';

const router = Router();

// Get daily summary (manager only)
router.get('/daily-summary', authenticateToken, requireManager, getDailySummary);

// Get missed/delayed lessons (manager only)
router.get('/missed-lessons', authenticateToken, requireManager, getMissedLessons);

// Get teacher attendance (manager only)
router.get('/teacher-attendance', authenticateToken, requireManager, getTeacherAttendance);

export default router;
