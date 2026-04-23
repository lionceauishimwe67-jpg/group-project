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
import path from 'path';
import fs from 'fs';

const router = Router();

// Public routes (for display screen)
router.get('/', getAnnouncements);

// Serve image files with proper CORS
router.get('/file/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', 'announcements', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'File not found' });
  }
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  res.sendFile(filePath);
});

// Protected routes (admin only)
router.get('/all', authenticateToken, getAllAnnouncements);
router.get('/images', authenticateToken, getAvailableImages);
router.get('/:id', authenticateToken, getAnnouncement);
router.post('/', authenticateToken, requireAdmin, upload.single('image'), createAnnouncement);
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), updateAnnouncement);
router.delete('/:id', authenticateToken, requireAdmin, deleteAnnouncement);
router.post('/reorder', authenticateToken, requireAdmin, reorderAnnouncements);

export default router;
