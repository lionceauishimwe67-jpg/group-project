import { Router } from 'express';
import {
  getCurrentSessions,
  getTimetable,
  getTimetableEntry,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  getReferenceData
} from '../controllers/timetableController';
import { authenticateToken, optionalAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes (for display screen)
router.get('/current-sessions', getCurrentSessions);
router.get('/today', getTimetable);

// Protected routes (admin only)
router.get('/entries', authenticateToken, requireAdmin, getTimetable);
router.get('/entries/:id', authenticateToken, requireAdmin, getTimetableEntry);
router.post('/', authenticateToken, requireAdmin, createTimetableEntry);
router.put('/:id', authenticateToken, requireAdmin, updateTimetableEntry);
router.delete('/:id', authenticateToken, requireAdmin, deleteTimetableEntry);

// Reference data (for dropdowns in admin)
router.get('/reference-data', authenticateToken, requireAdmin, getReferenceData);

export default router;
