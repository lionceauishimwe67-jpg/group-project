import { Router } from 'express';
import {
  getAnnouncements,
  getAllAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  reorderAnnouncements,
  getAvailableImages,
  markAnnouncementAsRead,
  getAnnouncementDeliveryStatus
} from '../controllers/announcementController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import upload from '../middleware/upload';
import path from 'path';
import fs from 'fs';
import { query } from '../config/database';

const router = Router();

// Public routes (for display screen)
router.get('/', getAnnouncements);

// Serve image from database by announcement ID
router.get('/image/:id', async (req, res) => {
  try {
    console.log(`[Image Serve] Request for announcement ID: ${req.params.id}`);
    
    const announcement = await query<any[]>('SELECT image_data, image_mime_type FROM announcements WHERE id = ?', [req.params.id]);
    
    console.log(`[Image Serve] Query result: ${announcement.length} rows`);
    
    if (announcement.length === 0) {
      console.log(`[Image Serve] Announcement not found`);
      return res.status(404).json({ success: false, error: 'Image not found' });
    }
    
    if (!announcement[0].image_data) {
      console.log(`[Image Serve] No image data in database`);
      return res.status(404).json({ success: false, error: 'No image data' });
    }
    
    const { image_data, image_mime_type } = announcement[0];
    
    // SQLite returns BLOB as Buffer, but let's ensure it's properly handled
    let imageData: Buffer;
    if (Buffer.isBuffer(image_data)) {
      imageData = image_data;
      console.log(`[Image Serve] Image is a Buffer, size: ${imageData.length} bytes`);
    } else {
      // Convert to Buffer if it's not already
      console.log(`[Image Serve] Converting image data to Buffer, type: ${typeof image_data}`);
      imageData = Buffer.from(image_data);
    }
    
    console.log(`[Image Serve] MIME type: ${image_mime_type}`);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', image_mime_type || 'image/jpeg');
    res.setHeader('Content-Length', imageData.length.toString());
    
    res.send(imageData);
    console.log(`[Image Serve] Image sent successfully`);
  } catch (error) {
    console.error('[Image Serve] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to serve image' });
  }
});

// Serve image files with proper CORS (fallback for file system)
router.get('/file/:filename', (req, res) => {
  const filename = req.params.filename;
  
  // Try to find the file in the announcements directory or subdirectories
  const announcementsDir = path.join(process.cwd(), 'uploads', 'announcements');
  
  // First try direct path in announcements directory
  let filePath = path.join(announcementsDir, filename);
  
  // If not found, search in subdirectories
  if (!fs.existsSync(filePath)) {
    const subdirs = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp', 'tiff', 'avif', 'heic'];
    for (const subdir of subdirs) {
      const subdirPath = path.join(announcementsDir, subdir, filename);
      if (fs.existsSync(subdirPath)) {
        filePath = subdirPath;
        break;
      }
    }
  }
  
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
router.get('/:id/delivery-status', authenticateToken, requireAdmin, getAnnouncementDeliveryStatus);
router.get('/:id', authenticateToken, getAnnouncement);
router.post('/:id/mark-read', authenticateToken, markAnnouncementAsRead);
router.post('/', authenticateToken, requireAdmin, upload.single('image'), createAnnouncement);
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), updateAnnouncement);
router.delete('/:id', authenticateToken, requireAdmin, deleteAnnouncement);
router.post('/reorder', authenticateToken, requireAdmin, reorderAnnouncements);

export default router;
