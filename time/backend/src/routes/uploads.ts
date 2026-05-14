import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getAllUploads,
  getUploadById,
  createUpload,
  deleteUpload,
  getUploadStats
} from '../controllers/uploadController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'files');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Get all uploads (admin only)
router.get('/', authenticateToken, requireAdmin, getAllUploads);

// Get upload stats (admin only)
router.get('/stats', authenticateToken, requireAdmin, getUploadStats);

// Get upload by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, getUploadById);

// Upload file (admin only)
router.post('/', authenticateToken, requireAdmin, upload.single('file'), createUpload);

// Delete upload (admin only)
router.delete('/:id', authenticateToken, requireAdmin, deleteUpload);

export default router;
