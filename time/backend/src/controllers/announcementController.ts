import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { query } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { Announcement } from '../types';
import { io } from '../server';
import { sendSMSToTeachers } from '../services/smsService';

const guessImageMimeType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.avif': 'image/avif',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// Get active announcements (for display screen)
export const getAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const announcements = await query<any[]>(`
    SELECT 
      id,
      title,
      text_content,
      image_path,
      image_mime_type,
      display_order,
      is_active,
      is_approved_for_display,
      expires_at,
      created_at,
      CASE 
        WHEN expires_at IS NOT NULL AND datetime(expires_at) < datetime('now')
        THEN 1
        ELSE 0
      END as is_expired,
      image_data IS NOT NULL as has_image_data
    FROM announcements
    WHERE is_active = 1
      AND (expires_at IS NULL OR datetime(expires_at) >= datetime('now'))
      AND (image_data IS NULL OR image_path IS NULL OR is_approved_for_display = 1)
    ORDER BY display_order ASC, created_at DESC
  `);

  // Add full URL to image paths (prefer database storage)
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const announcementsWithUrl = announcements.map(ann => ({
    ...ann,
    image_url: ann.image_path 
      ? (ann.image_path.startsWith('http://') || ann.image_path.startsWith('https://') 
          ? ann.image_path 
          : (ann.has_image_data 
            ? `${baseUrl}/api/announcements/image/${ann.id}`
            : `${baseUrl}${ann.image_path.replace(/\\/g, '/')}`))
      : null
  }));

  return res.json({
    success: true,
    data: announcementsWithUrl,
    meta: {
      count: announcements.length
    }
  });
});

// Get all announcements (for admin)
export const getAllAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const { includeExpired = 'false' } = req.query;

  let sql = `
    SELECT 
      id,
      title,
      text_content,
      image_path,
      image_mime_type,
      display_order,
      is_active,
      is_approved_for_display,
      expires_at,
      created_at,
      CASE 
        WHEN expires_at < datetime('now') THEN 1 
        ELSE 0 
      END as is_expired,
      image_data IS NOT NULL as has_image_data
    FROM announcements
    WHERE 1=1
  `;

  if (includeExpired !== 'true') {
    sql += " AND (expires_at IS NULL OR expires_at > datetime('now'))";
  }

  sql += ' ORDER BY display_order ASC, created_at DESC';

  const announcements = await query<any[]>(sql);

  // Add full URL to image paths (prefer database storage)
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const announcementsWithUrl = announcements.map(ann => ({
    ...ann,
    image_url: ann.image_path 
      ? (ann.image_path.startsWith('http://') || ann.image_path.startsWith('https://') 
          ? ann.image_path 
          : (ann.has_image_data 
            ? `${baseUrl}/api/announcements/image/${ann.id}`
            : `${baseUrl}${ann.image_path.replace(/\\/g, '/')}`))
      : null
  }));

  return res.json({
    success: true,
    data: announcementsWithUrl,
    meta: {
      count: announcements.length
    }
  });
});

// Get single announcement
export const getAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const announcements = await query<Announcement[]>(`
    SELECT 
      id,
      title,
      text_content,
      image_path,
      display_order,
      is_active,
      is_approved_for_display,
      expires_at,
      created_at
    FROM announcements
    WHERE id = ?
  `, [id]);

  if (announcements.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Announcement not found'
    });
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;

  return res.json({
    success: true,
    data: {
      ...announcements[0],
      image_url: announcements[0].image_path 
        ? (announcements[0].image_path.startsWith('http://') || announcements[0].image_path.startsWith('https://') 
            ? announcements[0].image_path 
            : `${baseUrl}/${(announcements[0].image_path || '').replace(/\\/g, '/')}`)
        : null
    }
  });
});

// Create announcement
export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { title, text_content, display_order = 0, expires_at = null, image_url = null, local_path = null } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      error: 'Title is required'
    });
  }

  let imagePath = image_url;
  let imageData: Buffer | null = null;
  let imageMimeType: string | null = null;
  
  // If file uploaded, read and store in database (multer memoryStorage)
  if (req.file) {
    try {
      imageData = req.file.buffer;
      imageMimeType = guessImageMimeType(req.file.originalname);
      
      // Keep image_path for reference but store actual data in database
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(req.file.originalname).toLowerCase();
      imagePath = `uploads/announcements/announcement-${uniqueSuffix}${ext}`;
    } catch (err) {
      console.error('Failed to read uploaded file:', err);
      return res.status(400).json({
        success: false,
        error: 'Failed to process uploaded file'
      });
    }
  } else if (local_path) {
    // Handle local file path - read and store in database
    try {
      if (!fs.existsSync(local_path)) {
        return res.status(400).json({
          success: false,
          error: 'Local file not found'
        });
      }
      
      imageData = fs.readFileSync(local_path);
      
      // Determine MIME type
      const ext = path.extname(local_path).toLowerCase();
      imageMimeType = guessImageMimeType(local_path);
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const destFileName = `announcement-${uniqueSuffix}${ext}`;
      imagePath = `uploads/announcements/${destFileName}`;
    } catch (err) {
      console.error('Failed to read local file:', err);
      return res.status(400).json({
        success: false,
        error: 'Failed to read file from local path. Check if path is correct.'
      });
    }
  }

  const result = await query<{ insertId: number }>(`
    INSERT INTO announcements (title, text_content, image_path, image_data, image_mime_type, display_order, is_active, is_approved_for_display, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [title, text_content || null, imagePath, imageData, imageMimeType, display_order, 1, 1, expires_at || null]);

  // Initialize delivery status for all teachers
  await initializeAnnouncementDelivery(result.insertId);

  // Notify display screens to refresh announcements with full data for instant display
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  io.emit('announcement-updated', {
    type: 'created',
    id: result.insertId,
    announcement: {
      id: result.insertId,
      title,
      text_content: text_content || null,
      image_url: imageData ? `${baseUrl}/api/announcements/image/${result.insertId}` : (imagePath ? `${baseUrl}${imagePath.replace(/\\/g, '/')}` : null),
      image_path: imagePath,
      has_image: !!imageData,
      display_order,
      is_active: 1,
      is_approved_for_display: 1,
    }
  });

  // Send SMS notification to teachers with SMS enabled
  const smsMessage = `New Announcement: ${title}${text_content ? ` - ${text_content.substring(0, 100)}` : ''}`;
  sendSMSToTeachers(smsMessage, 'announcement').catch((err: Error) => {
    console.error('Failed to send SMS for announcement:', err);
  });

  return res.status(201).json({
    success: true,
    data: {
      id: result.insertId,
      title,
      text_content,
      image_path: imagePath,
      image_url: imageData ? `${baseUrl}/api/announcements/image/${result.insertId}` : null,
      display_order,
      expires_at
    },
    message: 'Announcement created successfully'
  });
});

// Update announcement
export const updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, text_content, display_order, is_active, is_approved_for_display, expires_at, image_url, local_path } = req.body;

  // Check if announcement exists
  const existing = await query<Announcement[]>('SELECT * FROM announcements WHERE id = ?', [id]);

  if (existing.length === 0) {
    if (req.file) {
      // File is in memory, no need to delete
    }
    return res.status(404).json({
      success: false,
      error: 'Announcement not found'
    });
  }

  const oldImagePath = existing[0].image_path;

  // Build update fields
  const updateFields: string[] = [];
  const values: any[] = [];

  if (title !== undefined) {
    updateFields.push('title = ?');
    values.push(title);
  }

  if (text_content !== undefined) {
    updateFields.push('text_content = ?');
    values.push(text_content);
  }

  if (display_order !== undefined) {
    updateFields.push('display_order = ?');
    values.push(display_order);
  }

  if (is_active !== undefined) {
    updateFields.push('is_active = ?');
    const active =
      is_active === true ||
      is_active === 1 ||
      is_active === '1' ||
      is_active === 'true';
    values.push(active ? 1 : 0);
  }

  if (expires_at !== undefined) {
    updateFields.push('expires_at = ?');
    values.push(expires_at || null);
  }

  if (is_approved_for_display !== undefined) {
    updateFields.push('is_approved_for_display = ?');
    const approved =
      is_approved_for_display === true ||
      is_approved_for_display === 1 ||
      is_approved_for_display === '1' ||
      is_approved_for_display === 'true';
    values.push(approved ? 1 : 0);
  }

  // Handle image update
  if (req.file) {
    try {
      const imageData = req.file.buffer;
      
      // Determine MIME type
      const ext = path.extname(req.file.originalname).toLowerCase();
      const imageMimeType = guessImageMimeType(req.file.originalname);
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const newImagePath = `uploads/announcements/announcement-${uniqueSuffix}${ext}`;
      
      updateFields.push('image_path = ?');
      values.push(newImagePath);
      updateFields.push('image_data = ?');
      values.push(imageData);
      updateFields.push('image_mime_type = ?');
      values.push(imageMimeType);
    } catch (err) {
      console.error('Failed to process uploaded file:', err);
      return res.status(400).json({
        success: false,
        error: 'Failed to process uploaded file'
      });
    }
  } else if (local_path) {
    // Handle local file path - read and store in database
    try {
      if (!fs.existsSync(local_path)) {
        return res.status(400).json({
          success: false,
          error: 'Local file not found'
        });
      }
      
      const imageData = fs.readFileSync(local_path);
      
      // Determine MIME type
      const ext = path.extname(local_path).toLowerCase();
      const imageMimeType = guessImageMimeType(local_path);
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const destFileName = `announcement-${uniqueSuffix}${ext}`;
      const newImagePath = `uploads/announcements/${destFileName}`;
      
      updateFields.push('image_path = ?');
      values.push(newImagePath);
      updateFields.push('image_data = ?');
      values.push(imageData);
      updateFields.push('image_mime_type = ?');
      values.push(imageMimeType);
    } catch (err) {
      console.error('Failed to read local file:', err);
      return res.status(400).json({
        success: false,
        error: 'Failed to read file from local path'
      });
    }
  } else if (image_url !== undefined) {
    updateFields.push('image_path = ?');
    values.push(image_url);
    updateFields.push('image_data = ?');
    values.push(null);
    updateFields.push('image_mime_type = ?');
    values.push(null);
  }

  if (updateFields.length === 0) {
    if (req.file) {
      // File is in memory, no need to delete
    }
    return res.status(400).json({
      success: false,
      error: 'No valid fields to update'
    });
  }

  values.push(id);

  await query(
    `UPDATE announcements SET ${updateFields.join(', ')} WHERE id = ?`,
    values
  );

  // Fetch updated announcement
  const updated = await query<any[]>('SELECT * FROM announcements WHERE id = ?', [id]);
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  // Notify display screens to refresh announcements
  io.emit('announcement-updated', { type: 'updated', id });

  return res.json({
    success: true,
    data: {
      ...updated[0],
      image_url: updated[0].image_data 
        ? `${baseUrl}/api/announcements/image/${updated[0].id}`
        : (updated[0].image_path 
          ? `${baseUrl}${updated[0].image_path.replace(/\\/g, '/')}`
          : null)
    },
    message: 'Announcement updated successfully'
  });
});

// Delete announcement
export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if announcement exists
  const existing = await query<Announcement[]>('SELECT * FROM announcements WHERE id = ?', [id]);

  if (existing.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Announcement not found'
    });
  }

  const imagePath = existing[0].image_path;

  // Delete image file (convert relative path to absolute for deletion)
  if (imagePath) {
    const absolutePath = imagePath.startsWith('uploads/') 
      ? path.join(process.cwd(), (imagePath || '').replace(/\//g, path.sep))
      : imagePath;
    
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
      } catch (err) {
        console.error('Failed to delete image file:', err);
      }
    }
  }

  await query('DELETE FROM announcements WHERE id = ?', [id]);

  // Notify display screens to refresh announcements
  io.emit('announcement-updated', { type: 'deleted', id: parseInt(id) });

  return res.json({
    success: true,
    message: 'Announcement deleted successfully'
  });
});

// Reorder announcements
export const reorderAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const { orders } = req.body; // Array of { id, display_order }

  if (!Array.isArray(orders)) {
    return res.status(400).json({
      success: false,
      error: 'Orders must be an array of { id, display_order }'
    });
  }

  for (const item of orders) {
    await query(
      'UPDATE announcements SET display_order = ? WHERE id = ?',
      [item.display_order, item.id]
    );
  }

  // Notify display screens to refresh announcements
  io.emit('announcement-updated', { type: 'reordered' });

  return res.json({
    success: true,
    message: 'Announcements reordered successfully'
  });
});

// Get available images from uploads folder
export const getAvailableImages = asyncHandler(async (req: Request, res: Response) => {
  const uploadDir = path.join(process.cwd(), 'uploads', 'announcements');
  
  if (!fs.existsSync(uploadDir)) {
    return res.json({
      success: true,
      data: [],
      meta: { count: 0 }
    });
  }

  const files = fs.readdirSync(uploadDir);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif', '.avif', '.heic', '.heif'];
  
  const images = files
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    })
    .map(file => ({
      filename: file,
      path: `uploads/announcements/${file}`,
      url: `${req.protocol}://${req.get('host')}/uploads/announcements/${file}`,
      size: fs.statSync(path.join(uploadDir, file)).size
    }))
    .sort((a, b) => b.size - a.size);

  return res.json({
    success: true,
    data: images,
    meta: {
      count: images.length
    }
  });
});

// Mark announcement as read by a teacher
export const markAnnouncementAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { announcementId } = req.params;
  const { teacherId } = req.body;

  if (!teacherId) {
    return res.status(400).json({
      success: false,
      error: 'Teacher ID is required'
    });
  }

  // Check if delivery status record exists
  const existing = await query<any[]>(`
    SELECT * FROM announcement_delivery_status
    WHERE announcement_id = ? AND teacher_id = ?
  `, [announcementId, teacherId]);

  if (existing.length === 0) {
    // Create new record with read status
    await query(`
      INSERT INTO announcement_delivery_status (announcement_id, teacher_id, status, sent_at, delivered_at, read_at)
      VALUES (?, ?, 'read', datetime('now'), datetime('now'), datetime('now'))
    `, [announcementId, teacherId]);
  } else {
    // Update existing record to read
    await query(`
      UPDATE announcement_delivery_status
      SET status = 'read', read_at = datetime('now'), updated_at = datetime('now')
      WHERE announcement_id = ? AND teacher_id = ?
    `, [announcementId, teacherId]);
  }

  return res.json({
    success: true,
    message: 'Announcement marked as read'
  });
});

// Get delivery status for an announcement
export const getAnnouncementDeliveryStatus = asyncHandler(async (req: Request, res: Response) => {
  const announcementId = req.params.announcementId || req.params.id;

  const deliveryStatus = await query<any[]>(`
    SELECT 
      ads.id,
      ads.announcement_id,
      ads.teacher_id,
      ads.status,
      ads.sent_at,
      ads.delivered_at,
      ads.read_at,
      t.name as teacher_name,
      t.email as teacher_email
    FROM announcement_delivery_status ads
    LEFT JOIN teachers t ON ads.teacher_id = t.id
    WHERE ads.announcement_id = ?
    ORDER BY ads.status ASC, ads.read_at DESC
  `, [announcementId]);

  // Get total teacher count
  const totalTeachers = await query<any[]>(`SELECT COUNT(*) as count FROM teachers`);
  const teacherCount = totalTeachers[0].count;

  // Calculate statistics
  const sent = deliveryStatus.filter(s => s.status === 'sent').length;
  const delivered = deliveryStatus.filter(s => s.status === 'delivered').length;
  const read = deliveryStatus.filter(s => s.status === 'read').length;

  return res.json({
    success: true,
    data: deliveryStatus,
    meta: {
      total_teachers: teacherCount,
      sent,
      delivered,
      read,
      pending: teacherCount - deliveryStatus.length
    }
  });
});

// Initialize delivery status for a new announcement (called when announcement is created)
export const initializeAnnouncementDelivery = async (announcementId: number) => {
  try {
    // Get all teachers
    const teachers = await query<any[]>(`SELECT id FROM teachers`);
    
    // Create delivery status records for all teachers
    for (const teacher of teachers) {
      await query(`
        INSERT OR IGNORE INTO announcement_delivery_status (announcement_id, teacher_id, status, sent_at)
        VALUES (?, ?, 'sent', datetime('now'))
      `, [announcementId, teacher.id]);
    }
  } catch (error) {
    console.error('Error initializing announcement delivery:', error);
  }
};
