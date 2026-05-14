import { Router } from 'express';
import {
  getAllAlumni,
  getAlumniById,
  createAlumni,
  updateAlumni,
  deleteAlumni,
  getAlumniStats
} from '../controllers/alumniController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all alumni (public or admin)
router.get('/', getAllAlumni);

// Get alumni stats (admin only)
router.get('/stats', authenticateToken, requireAdmin, getAlumniStats);

// Get alumni by ID (public)
router.get('/:id', getAlumniById);

// Create alumni (admin only)
router.post('/', authenticateToken, requireAdmin, createAlumni);

// Update alumni (admin only)
router.put('/:id', authenticateToken, requireAdmin, updateAlumni);

// Delete alumni (admin only)
router.delete('/:id', authenticateToken, requireAdmin, deleteAlumni);

export default router;
