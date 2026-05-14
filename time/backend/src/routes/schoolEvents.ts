import { Router } from 'express';
import {
  getAllEvents,
  getUpcomingEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStats
} from '../controllers/schoolEventController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all events (public can see public events)
router.get('/', getAllEvents);

// Get upcoming events (public)
router.get('/upcoming', getUpcomingEvents);

// Get event stats (admin only)
router.get('/stats', authenticateToken, requireAdmin, getEventStats);

// Get event by ID (public)
router.get('/:id', getEventById);

// Create event (admin only)
router.post('/', authenticateToken, requireAdmin, createEvent);

// Update event (admin only)
router.put('/:id', authenticateToken, requireAdmin, updateEvent);

// Delete event (admin only)
router.delete('/:id', authenticateToken, requireAdmin, deleteEvent);

export default router;
