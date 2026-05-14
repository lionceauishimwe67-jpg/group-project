import { Request, Response } from 'express';
import { query, queryOne, run } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import path from 'path';
import fs from 'fs';

export interface Upload {
  id: number;
  original_name: string;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  category: string;
  entity_type?: string;
  entity_id?: number;
  uploaded_by?: number;
  created_at?: string;
}

// Get all uploads with filters
export const getAllUploads = asyncHandler(async (req: Request, res: Response) => {
  const { category, entityType, entityId, search } = req.query;
  
  let sql = 'SELECT u.*, us.username as uploader_name FROM uploads u LEFT JOIN users us ON u.uploaded_by = us.id WHERE 1=1';
  const params: any[] = [];
  
  if (category) {
    sql += ' AND u.category = ?';
    params.push(category);
  }
  if (entityType) {
    sql += ' AND u.entity_type = ?';
    params.push(entityType);
  }
  if (entityId) {
    sql += ' AND u.entity_id = ?';
    params.push(entityId);
  }
  if (search) {
    sql += ' AND (u.original_name LIKE ? OR u.file_type LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term);
  }
  
  sql += ' ORDER BY u.created_at DESC';
  
  const uploads = await query<Upload[]>(sql, params);
  res.json({ success: true, uploads });
});

// Get upload by ID
export const getUploadById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const upload = await queryOne<Upload>(`
    SELECT u.*, us.username as uploader_name 
    FROM uploads u 
    LEFT JOIN users us ON u.uploaded_by = us.id 
    WHERE u.id = ?
  `, [id]);
  
  if (!upload) {
    return res.status(404).json({ success: false, error: 'Upload not found' });
  }
  
  res.json({ success: true, upload });
});

// Create upload record (after file is saved by multer middleware)
export const createUpload = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  const { category, entity_type, entity_id, uploaded_by } = req.body;
  
  if (!file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  
  const result = await run(`
    INSERT INTO uploads (
      original_name, file_name, file_path, file_type, file_size,
      category, entity_type, entity_id, uploaded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    file.originalname,
    file.filename,
    file.path,
    file.mimetype,
    file.size,
    category || 'general',
    entity_type || null,
    entity_id || null,
    uploaded_by || null
  ]);
  
  res.status(201).json({ 
    success: true, 
    message: 'File uploaded successfully', 
    uploadId: result.lastID,
    file: {
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    }
  });
});

// Delete upload
export const deleteUpload = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const upload = await queryOne<Upload>('SELECT * FROM uploads WHERE id = ?', [id]);
  
  if (!upload) {
    return res.status(404).json({ success: false, error: 'Upload not found' });
  }
  
  // Delete file from filesystem
  try {
    if (fs.existsSync(upload.file_path)) {
      fs.unlinkSync(upload.file_path);
    }
  } catch (err) {
    console.warn('Could not delete file from filesystem:', err);
  }
  
  await run('DELETE FROM uploads WHERE id = ?', [id]);
  
  res.json({ success: true, message: 'Upload deleted successfully' });
});

// Get upload statistics
export const getUploadStats = asyncHandler(async (req: Request, res: Response) => {
  const total = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM uploads');
  const totalSize = await queryOne<{ size: number }>('SELECT COALESCE(SUM(file_size), 0) as size FROM uploads');
  const byCategory = await query<any[]>(`
    SELECT category, COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size
    FROM uploads 
    GROUP BY category 
    ORDER BY count DESC
  `);
  
  res.json({
    success: true,
    stats: {
      total: total?.count || 0,
      totalSize: totalSize?.size || 0,
      byCategory
    }
  });
});
