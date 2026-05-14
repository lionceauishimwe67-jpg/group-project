import { Request, Response } from 'express';
import { query, queryOne, run } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

export interface Parent {
  id: number;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  relationship?: string;
  created_at?: string;
  updated_at?: string;
  students?: any[];
}

// Get all parents with optional filters
export const getAllParents = asyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query;
  
  let sql = 'SELECT * FROM parents WHERE 1=1';
  const params: any[] = [];
  
  if (search) {
    sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const parents = await query<Parent[]>(sql, params);
  
  // Get associated students for each parent
  for (const parent of parents) {
    const students = await query<any[]>(`
      SELECT s.id, s.name, s.student_id, s.class_id, c.name as class_name, sp.is_primary
      FROM students s
      JOIN student_parents sp ON s.id = sp.student_id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE sp.parent_id = ?
    `, [parent.id]);
    parent.students = students;
  }
  
  res.json({ success: true, parents });
});

// Get parent by ID with students
export const getParentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const parent = await queryOne<Parent>('SELECT * FROM parents WHERE id = ?', [id]);
  
  if (!parent) {
    return res.status(404).json({ success: false, error: 'Parent not found' });
  }
  
  const students = await query<any[]>(`
    SELECT s.id, s.name, s.student_id, s.photo, s.class_id, c.name as class_name, sp.is_primary
    FROM students s
    JOIN student_parents sp ON s.id = sp.student_id
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE sp.parent_id = ?
  `, [id]);
  
  parent.students = students;
  
  res.json({ success: true, parent });
});

// Create parent
export const createParent = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, address, relationship } = req.body;
  
  if (!name || !phone) {
    return res.status(400).json({ success: false, error: 'Name and phone are required' });
  }
  
  const result = await run(`
    INSERT INTO parents (name, email, phone, address, relationship)
    VALUES (?, ?, ?, ?, ?)
  `, [name, email || null, phone, address || null, relationship || 'guardian']);
  
  res.status(201).json({ 
    success: true, 
    message: 'Parent created successfully', 
    parentId: result.lastID 
  });
});

// Update parent
export const updateParent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, address, relationship } = req.body;
  
  const existing = await queryOne<Parent>('SELECT id FROM parents WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Parent not found' });
  }
  
  await run(`
    UPDATE parents SET
      name = ?, email = ?, phone = ?, address = ?, relationship = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [name, email || null, phone, address || null, relationship || 'guardian', id]);
  
  res.json({ success: true, message: 'Parent updated successfully' });
});

// Delete parent
export const deleteParent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // First remove student associations
  await run('DELETE FROM student_parents WHERE parent_id = ?', [id]);
  
  const result = await run('DELETE FROM parents WHERE id = ?', [id]);
  
  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: 'Parent not found' });
  }
  
  res.json({ success: true, message: 'Parent deleted successfully' });
});

// Link parent to student
export const linkParentToStudent = asyncHandler(async (req: Request, res: Response) => {
  const { parentId, studentId, isPrimary } = req.body;
  
  if (!parentId || !studentId) {
    return res.status(400).json({ success: false, error: 'Parent ID and student ID are required' });
  }
  
  try {
    await run(`
      INSERT OR REPLACE INTO student_parents (student_id, parent_id, is_primary)
      VALUES (?, ?, ?)
    `, [studentId, parentId, isPrimary ? 1 : 0]);
    
    res.json({ success: true, message: 'Parent linked to student successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to link parent to student' });
  }
});

// Unlink parent from student
export const unlinkParentFromStudent = asyncHandler(async (req: Request, res: Response) => {
  const { parentId, studentId } = req.body;
  
  if (!parentId || !studentId) {
    return res.status(400).json({ success: false, error: 'Parent ID and student ID are required' });
  }
  
  await run('DELETE FROM student_parents WHERE parent_id = ? AND student_id = ?', [parentId, studentId]);
  
  res.json({ success: true, message: 'Parent unlinked from student successfully' });
});
