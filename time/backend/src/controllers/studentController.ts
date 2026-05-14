import { Request, Response } from 'express';
import { query, queryOne, run } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

export interface Student {
  id: number;
  student_id: string;
  name: string;
  photo?: string;
  age?: number;
  email?: string;
  phone?: string;
  address?: string;
  class_id?: number;
  class_name?: string;
  enrollment_date?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

// Get all students with optional filters
export const getAllStudents = asyncHandler(async (req: Request, res: Response) => {
  const { classId, status, search } = req.query;
  
  let sql = `
    SELECT s.*, c.name as class_name 
    FROM students s 
    LEFT JOIN classes c ON s.class_id = c.id 
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (classId) {
    sql += ' AND s.class_id = ?';
    params.push(classId);
  }
  if (status) {
    sql += ' AND s.status = ?';
    params.push(status);
  }
  if (search) {
    sql += ' AND (s.name LIKE ? OR s.student_id LIKE ? OR s.email LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  sql += ' ORDER BY s.created_at DESC';
  
  const students = await query<Student[]>(sql, params);
  res.json({ success: true, students });
});

// Get student by ID with details
export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const student = await queryOne<Student>(`
    SELECT s.*, c.name as class_name 
    FROM students s 
    LEFT JOIN classes c ON s.class_id = c.id 
    WHERE s.id = ?
  `, [id]);
  
  if (!student) {
    return res.status(404).json({ success: false, error: 'Student not found' });
  }
  
  // Get grades
  const grades = await query<any[]>(`
    SELECT g.*, sub.name as subject_name 
    FROM grades g 
    JOIN subjects sub ON g.subject_id = sub.id 
    WHERE g.student_id = ? 
    ORDER BY g.created_at DESC
  `, [id]);
  
  // Get attendance summary
  const attendance = await queryOne<any>(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
    FROM student_attendance 
    WHERE student_id = ?
  `, [id]);
  
  // Get parents
  const parents = await query<any[]>(`
    SELECT p.*, sp.is_primary 
    FROM parents p 
    JOIN student_parents sp ON p.id = sp.parent_id 
    WHERE sp.student_id = ?
  `, [id]);
  
  res.json({ 
    success: true, 
    student: { ...student, grades, attendance, parents } 
  });
});

// Create student
export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const {
    student_id, name, photo, age, email, phone, address,
    class_id, guardian_name, guardian_phone, guardian_email, status
  } = req.body;
  
  if (!student_id || !name) {
    return res.status(400).json({ success: false, error: 'Student ID and name are required' });
  }
  
  try {
    const result = await run(`
      INSERT INTO students (
        student_id, name, photo, age, email, phone, address,
        class_id, guardian_name, guardian_phone, guardian_email, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [student_id, name, photo || null, age || null, email || null, phone || null, address || null,
        class_id || null, guardian_name || null, guardian_phone || null, guardian_email || null,
        status || 'Active']);
    
    res.status(201).json({ 
      success: true, 
      message: 'Student created successfully', 
      studentId: result.lastID 
    });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, error: 'Student ID already exists' });
    }
    throw error;
  }
});

// Update student
export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    student_id, name, photo, age, email, phone, address,
    class_id, guardian_name, guardian_phone, guardian_email, status
  } = req.body;
  
  const existing = await queryOne<Student>('SELECT id FROM students WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Student not found' });
  }
  
  await run(`
    UPDATE students SET
      student_id = ?, name = ?, photo = ?, age = ?, email = ?, phone = ?,
      address = ?, class_id = ?, guardian_name = ?, guardian_phone = ?,
      guardian_email = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [student_id, name, photo || null, age || null, email || null, phone || null,
      address || null, class_id || null, guardian_name || null, guardian_phone || null,
      guardian_email || null, status || 'Active', id]);
  
  res.json({ success: true, message: 'Student updated successfully' });
});

// Delete student
export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const result = await run('DELETE FROM students WHERE id = ?', [id]);
  
  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: 'Student not found' });
  }
  
  res.json({ success: true, message: 'Student deleted successfully' });
});

// Get student statistics
export const getStudentStats = asyncHandler(async (req: Request, res: Response) => {
  const total = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM students');
  const active = await queryOne<{ count: number }>("SELECT COUNT(*) as count FROM students WHERE status = 'Active'");
  const graduated = await queryOne<{ count: number }>("SELECT COUNT(*) as count FROM students WHERE status = 'Graduated'");
  const byClass = await query<any[]>(`
    SELECT c.name as class_name, COUNT(s.id) as count 
    FROM students s 
    JOIN classes c ON s.class_id = c.id 
    WHERE s.status = 'Active'
    GROUP BY c.id 
    ORDER BY count DESC
  `);
  
  res.json({
    success: true,
    stats: { total: total?.count || 0, active: active?.count || 0, graduated: graduated?.count || 0, byClass }
  });
});

// Record attendance
export const recordAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { student_id, date, status, timetable_id, notes, recorded_by } = req.body;
  
  if (!student_id || !date || !status) {
    return res.status(400).json({ success: false, error: 'Student ID, date, and status are required' });
  }
  
  try {
    await run(`
      INSERT OR REPLACE INTO student_attendance 
      (student_id, date, status, timetable_id, notes, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [student_id, date, status, timetable_id || null, notes || null, recorded_by || null]);
    
    res.json({ success: true, message: 'Attendance recorded' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to record attendance' });
  }
});
