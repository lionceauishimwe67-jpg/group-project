import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { query } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { Announcement } from '../types';

// Get active announcements (for display screen)
export const getAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const announcements = await query<Announcement[]>(`
    SELECT 
      id,
      title,
      image_path,
      display_order,
      is_active,
      expires_at,
      created_at
    FROM announcements
    WHERE is_active = 1
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    ORDER BY display_order ASC, created_at DESC
  `);

  // Add full URL to image paths (only if image_path exists and is not already a full URL)
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const announcementsWithUrl = announcements.map(ann => ({
    ...ann,
    image_url: ann.image_path 
      ? (ann.image_path.startsWith('http://') || ann.image_path.startsWith('https://') 
          ? ann.image_path 
          : `${baseUrl}/api/announcements/file/${(ann.image_path || '').split('/').pop()}`)
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
      image_path,
      display_order,
      is_active,
      expires_at,
      created_at,
      CASE 
        WHEN expires_at < datetime('now') THEN 1 
        ELSE 0 
      END as is_expired
    FROM announcements
    WHERE 1=1
  `;

  if (includeExpired !== 'true') {
    sql += " AND (expires_at IS NULL OR expires_at > datetime('now'))";
  }

  sql += ' ORDER BY display_order ASC, created_at DESC';

  const announcements = await query<Announcement[]>(sql);

  // Add full URL to image paths (only if image_path exists and is not already a full URL)
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const announcementsWithUrl = announcements.map(ann => ({
    ...ann,
    image_url: ann.image_path 
      ? (ann.image_path.startsWith('http://') || ann.image_path.startsWith('https://') 
          ? ann.image_path 
          : `${baseUrl}/api/announcements/file/${(ann.image_path || '').split('/').pop()}`)
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
      image_path,
      display_order,
      is_active,
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
  const { title, display_order = 0, expires_at = null, image_url = null, local_path = null } = req.body;

  if (!title) {
    // Delete uploaded file if validation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({
      success: false,
      error: 'Title is required'
    });
  }

  let imagePath = image_url;
  
  // If file uploaded, use relative path
  if (req.file) {
    imagePath = `uploads/announcements/${req.file.filename}`; // Store relative path
  } else if (local_path) {
    // Handle local file path - copy file to uploads directory
    try {
      const uploadDir = path.join(process.cwd(), 'uploads', 'announcements');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const sourcePath = local_path;
      const ext = path.extname(sourcePath);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const destFileName = `announcement-${uniqueSuffix}${ext}`;
      const destPath = path.join(uploadDir, destFileName);
      
      // Copy file from local path to uploads directory
      fs.copyFileSync(sourcePath, destPath);
      imagePath = `uploads/announcements/${destFileName}`; // Store relative path
    } catch (err) {
      console.error('Failed to copy local file:', err);
      return res.status(400).json({
        success: false,
        error: 'Failed to copy file from local path. Check if path is correct.'
      });
    }
  }
  // Image is now optional - can be null

  const result = await query<{ insertId: number }>(`
    INSERT INTO announcements (title, image_path, display_order, is_active, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `, [title, imagePath, display_order, 1, expires_at || null]);

  const baseUrl = `${req.protocol}://${req.get('host')}`;

  return res.status(201).json({
    success: true,
    data: {
      id: result.insertId,
      title,
      image_path: imagePath,
      image_url: imagePath ? `${baseUrl}/api/announcements/file/${(imagePath || '').split('/').pop()}` : null,
      display_order,
      expires_at
    },
    message: 'Announcement created successfully'
  });
});

// Update announcement
export const updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, display_order, is_active, expires_at, image_url, local_path } = req.body;

  // Check if announcement exists
  const existing = await query<Announcement[]>('SELECT * FROM announcements WHERE id = ?', [id]);

  if (existing.length === 0) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
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

  if (display_order !== undefined) {
    updateFields.push('display_order = ?');
    values.push(display_order);
  }

  if (is_active !== undefined) {
    updateFields.push('is_active = ?');
    values.push(is_active ? 1 : 0);
  }

  if (expires_at !== undefined) {
    updateFields.push('expires_at = ?');
    values.push(expires_at || null);
  }

  // Handle image update
  if (req.file) {
    const newImagePath = `uploads/announcements/${req.file.filename}`; // Store relative path
    updateFields.push('image_path = ?');
    values.push(newImagePath);

    // Delete old image (convert relative path to absolute for deletion)
    if (oldImagePath) {
      const oldAbsolutePath = oldImagePath.startsWith('uploads/') 
        ? path.join(process.cwd(), (oldImagePath || '').replace(/\//g, path.sep))
        : oldImagePath;
      if (fs.existsSync(oldAbsolutePath)) {
        try {
          fs.unlinkSync(oldAbsolutePath);
        } catch (err) {
          console.error('Failed to delete old image:', err);
        }
      }
    }
  } else if (local_path) {
    // Handle local file path - copy file to uploads directory
    try {
      const uploadDir = path.join(process.cwd(), 'uploads', 'announcements');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const sourcePath = local_path;
      const ext = path.extname(sourcePath);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const destFileName = `announcement-${uniqueSuffix}${ext}`;
      const destPath = path.join(uploadDir, destFileName);
      
      // Copy file from local path to uploads directory
      fs.copyFileSync(sourcePath, destPath);
      const newImagePath = `uploads/announcements/${destFileName}`; // Store relative path
      
      updateFields.push('image_path = ?');
      values.push(newImagePath);
      
      // Delete old image (convert relative path to absolute for deletion)
      if (oldImagePath) {
        const oldAbsolutePath = oldImagePath.startsWith('uploads/') 
          ? path.join(process.cwd(), (oldImagePath || '').replace(/\//g, path.sep))
          : oldImagePath;
        if (fs.existsSync(oldAbsolutePath)) {
          try {
            fs.unlinkSync(oldAbsolutePath);
          } catch (err) {
            console.error('Failed to delete old image:', err);
          }
        }
      }
    } catch (err) {
      console.error('Failed to copy local file:', err);
      return res.status(400).json({
        success: false,
        error: 'Failed to copy file from local path. Check if path is correct.'
      });
    }
  } else if (image_url !== undefined) {
    updateFields.push('image_path = ?');
    values.push(image_url);
  }

  if (updateFields.length === 0) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
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
  const updated = await query<Announcement[]>('SELECT * FROM announcements WHERE id = ?', [id]);
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  return res.json({
    success: true,
    data: {
      ...updated[0],
      image_url: updated[0].image_path ? `${baseUrl}/api/announcements/file/${(updated[0].image_path || '').split('/').pop()}` : null
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
