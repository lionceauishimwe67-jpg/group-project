import { Router } from 'express';
import {
  teacherCheckIn,
  teacherCheckOut,
  getTeacherCheckInStatus,
  getCheckInsByDate
} from '../controllers/teacherCheckinController';
import { authenticateToken, requireManager } from '../middleware/auth';

const router = Router();

// Teacher check-in (teacher or admin)
router.post('/checkin', authenticateToken, teacherCheckIn);

// Teacher check-out (teacher or admin)
router.post('/checkout', authenticateToken, teacherCheckOut);

// Get teacher check-in status (authenticated user can view their own)
router.get('/status/:teacherId', authenticateToken, getTeacherCheckInStatus);

// Get all check-ins by date (manager only)
router.get('/by-date', authenticateToken, requireManager, getCheckInsByDate);

export default router;
