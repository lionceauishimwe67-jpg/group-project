import { Router } from 'express';
import {
  getAnnouncements,
  getAllAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  reorderAnnouncements,
  getAvailableImages
} from '../controllers/announcementController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

// Public routes (for display screen)
router.get('/', getAnnouncements);

// Protected routes (admin only)
router.get('/all', authenticateToken, getAllAnnouncements);
router.get('/images', authenticateToken, getAvailableImages);
router.get('/:id', authenticateToken, getAnnouncement);
router.post('/', authenticateToken, requireAdmin, upload.single('image'), createAnnouncement);
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), updateAnnouncement);
router.delete('/:id', authenticateToken, requireAdmin, deleteAnnouncement);
router.post('/reorder', authenticateToken, requireAdmin, reorderAnnouncements);

export default router;
