import { Router } from 'express';
import {
  getPhoneNumbers,
  addPhoneNumber,
  deletePhoneNumber,
  togglePhoneNumber
} from '../controllers/phoneNumberController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Protected routes (admin only)
router.get('/', authenticateToken, requireAdmin, getPhoneNumbers);
router.post('/', authenticateToken, requireAdmin, addPhoneNumber);
router.delete('/:id', authenticateToken, requireAdmin, deletePhoneNumber);
router.post('/:id/toggle', authenticateToken, requireAdmin, togglePhoneNumber);

export default router;
