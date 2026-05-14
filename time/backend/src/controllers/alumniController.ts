import { Request, Response } from 'express';
import { query, queryOne, run } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

export interface Alumni {
  id: number;
  student_id?: number;
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  graduation_year?: number;
  current_position?: string;
  company?: string;
  bio?: string;
  achievements?: string;
  linkedin?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

// Get all alumni with filters
export const getAllAlumni = asyncHandler(async (req: Request, res: Response) => {
  const { graduationYear, search, status } = req.query;
  
  let sql = 'SELECT * FROM alumni WHERE 1=1';
  const params: any[] = [];
  
  if (graduationYear) {
    sql += ' AND graduation_year = ?';
    params.push(graduationYear);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (name LIKE ? OR company LIKE ? OR current_position LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  
  sql += ' ORDER BY graduation_year DESC, name ASC';
  
  const alumni = await query<Alumni[]>(sql, params);
  res.json({ success: true, alumni });
});

// Get alumni by ID
export const getAlumniById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const alumni = await queryOne<Alumni>('SELECT * FROM alumni WHERE id = ?', [id]);
  
  if (!alumni) {
    return res.status(404).json({ success: false, error: 'Alumni not found' });
  }
  
  res.json({ success: true, alumni });
});

// Create alumni
export const createAlumni = asyncHandler(async (req: Request, res: Response) => {
  const {
    student_id, name, email, phone, photo, graduation_year,
    current_position, company, bio, achievements, linkedin, status
  } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }
  
  const result = await run(`
    INSERT INTO alumni (
      student_id, name, email, phone, photo, graduation_year,
      current_position, company, bio, achievements, linkedin, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [student_id || null, name, email || null, phone || null, photo || null,
      graduation_year || null, current_position || null, company || null,
      bio || null, achievements || null, linkedin || null, status || 'active']);
  
  res.status(201).json({ 
    success: true, 
    message: 'Alumni created successfully', 
    alumniId: result.lastID 
  });
});

// Update alumni
export const updateAlumni = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name, email, phone, photo, graduation_year,
    current_position, company, bio, achievements, linkedin, status
  } = req.body;
  
  const existing = await queryOne<Alumni>('SELECT id FROM alumni WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Alumni not found' });
  }
  
  await run(`
    UPDATE alumni SET
      name = ?, email = ?, phone = ?, photo = ?, graduation_year = ?,
      current_position = ?, company = ?, bio = ?, achievements = ?,
      linkedin = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [name, email || null, phone || null, photo || null, graduation_year || null,
      current_position || null, company || null, bio || null,
      achievements || null, linkedin || null, status || 'active', id]);
  
  res.json({ success: true, message: 'Alumni updated successfully' });
});

// Delete alumni
export const deleteAlumni = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const result = await run('DELETE FROM alumni WHERE id = ?', [id]);
  
  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: 'Alumni not found' });
  }
  
  res.json({ success: true, message: 'Alumni deleted successfully' });
});

// Get alumni statistics
export const getAlumniStats = asyncHandler(async (req: Request, res: Response) => {
  const total = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM alumni');
  const byYear = await query<any[]>(`
    SELECT graduation_year, COUNT(*) as count 
    FROM alumni 
    WHERE graduation_year IS NOT NULL 
    GROUP BY graduation_year 
    ORDER BY graduation_year DESC
  `);
  const byCompany = await query<any[]>(`
    SELECT company, COUNT(*) as count 
    FROM alumni 
    WHERE company IS NOT NULL AND company != '' 
    GROUP BY company 
    ORDER BY count DESC 
    LIMIT 10
  `);
  
  res.json({
    success: true,
    stats: { total: total?.count || 0, byYear, byCompany }
  });
});
