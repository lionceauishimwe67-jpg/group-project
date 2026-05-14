import { Router } from 'express';
import {
  getAllParents,
  getParentById,
  createParent,
  updateParent,
  deleteParent,
  linkParentToStudent,
  unlinkParentFromStudent
} from '../controllers/parentController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all parents (admin only)
router.get('/', authenticateToken, requireAdmin, getAllParents);

// Get parent by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, getParentById);

// Create parent (admin only)
router.post('/', authenticateToken, requireAdmin, createParent);

// Update parent (admin only)
router.put('/:id', authenticateToken, requireAdmin, updateParent);

// Delete parent (admin only)
router.delete('/:id', authenticateToken, requireAdmin, deleteParent);

// Link parent to student (admin only)
router.post('/link', authenticateToken, requireAdmin, linkParentToStudent);

// Unlink parent from student (admin only)
router.post('/unlink', authenticateToken, requireAdmin, unlinkParentFromStudent);

export default router;
