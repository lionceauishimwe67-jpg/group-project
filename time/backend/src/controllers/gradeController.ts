import { Request, Response } from 'express';
import { query, queryOne, run } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

export interface Grade {
  id: number;
  student_id: number;
  subject_id: number;
  class_id?: number;
  teacher_id?: number;
  grade: string;
  grade_type: string;
  score?: number;
  max_score?: number;
  term?: string;
  academic_year?: string;
  comments?: string;
  created_at?: string;
  updated_at?: string;
  student_name?: string;
  subject_name?: string;
  class_name?: string;
  teacher_name?: string;
}

// Get all grades with filters
export const getAllGrades = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, subjectId, classId, term, academicYear } = req.query;
  
  let sql = `
    SELECT g.*, s.name as student_name, sub.name as subject_name, 
           c.name as class_name, t.name as teacher_name
    FROM grades g
    JOIN students s ON g.student_id = s.id
    JOIN subjects sub ON g.subject_id = sub.id
    LEFT JOIN classes c ON g.class_id = c.id
    LEFT JOIN teachers t ON g.teacher_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (studentId) {
    sql += ' AND g.student_id = ?';
    params.push(studentId);
  }
  if (subjectId) {
    sql += ' AND g.subject_id = ?';
    params.push(subjectId);
  }
  if (classId) {
    sql += ' AND g.class_id = ?';
    params.push(classId);
  }
  if (term) {
    sql += ' AND g.term = ?';
    params.push(term);
  }
  if (academicYear) {
    sql += ' AND g.academic_year = ?';
    params.push(academicYear);
  }
  
  sql += ' ORDER BY g.created_at DESC';
  
  const grades = await query<Grade[]>(sql, params);
  res.json({ success: true, grades });
});

// Get grades for a specific student
export const getStudentGrades = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  
  const grades = await query<Grade[]>(`
    SELECT g.*, sub.name as subject_name, c.name as class_name
    FROM grades g
    JOIN subjects sub ON g.subject_id = sub.id
    LEFT JOIN classes c ON g.class_id = c.id
    WHERE g.student_id = ?
    ORDER BY g.academic_year DESC, g.term DESC
  `, [studentId]);
  
  // Calculate GPA
  const gradePoints: Record<string, number> = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'F': 0.0
  };
  
  let totalPoints = 0;
  let count = 0;
  grades.forEach(g => {
    const point = gradePoints[g.grade?.toUpperCase()] || 0;
    if (point > 0) {
      totalPoints += point;
      count++;
    }
  });
  
  const gpa = count > 0 ? (totalPoints / count).toFixed(2) : '0.00';
  
  res.json({ success: true, grades, gpa });
});

// Create grade
export const createGrade = asyncHandler(async (req: Request, res: Response) => {
  const {
    student_id, subject_id, class_id, teacher_id, grade, grade_type,
    score, max_score, term, academic_year, comments
  } = req.body;
  
  if (!student_id || !subject_id || !grade) {
    return res.status(400).json({ success: false, error: 'Student ID, subject ID, and grade are required' });
  }
  
  const result = await run(`
    INSERT INTO grades (
      student_id, subject_id, class_id, teacher_id, grade, grade_type,
      score, max_score, term, academic_year, comments
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [student_id, subject_id, class_id || null, teacher_id || null, grade,
      grade_type || 'exam', score || null, max_score || 100, term || null,
      academic_year || null, comments || null]);
  
  res.status(201).json({ 
    success: true, 
    message: 'Grade recorded successfully', 
    gradeId: result.lastID 
  });
});

// Update grade
export const updateGrade = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    grade, grade_type, score, max_score, term, academic_year, comments
  } = req.body;
  
  const existing = await queryOne<Grade>('SELECT id FROM grades WHERE id = ?', [id]);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Grade not found' });
  }
  
  await run(`
    UPDATE grades SET
      grade = ?, grade_type = ?, score = ?, max_score = ?,
      term = ?, academic_year = ?, comments = ?, updated_at = datetime('now')
    WHERE id = ?
  `, [grade, grade_type || 'exam', score || null, max_score || 100,
      term || null, academic_year || null, comments || null, id]);
  
  res.json({ success: true, message: 'Grade updated successfully' });
});

// Delete grade
export const deleteGrade = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const result = await run('DELETE FROM grades WHERE id = ?', [id]);
  
  if (result.changes === 0) {
    return res.status(404).json({ success: false, error: 'Grade not found' });
  }
  
  res.json({ success: true, message: 'Grade deleted successfully' });
});

// Get grade statistics
export const getGradeStats = asyncHandler(async (req: Request, res: Response) => {
  const { classId, subjectId, term, academicYear } = req.query;
  
  let whereClause = 'WHERE 1=1';
  const params: any[] = [];
  
  if (classId) {
    whereClause += ' AND g.class_id = ?';
    params.push(classId);
  }
  if (subjectId) {
    whereClause += ' AND g.subject_id = ?';
    params.push(subjectId);
  }
  if (term) {
    whereClause += ' AND g.term = ?';
    params.push(term);
  }
  if (academicYear) {
    whereClause += ' AND g.academic_year = ?';
    params.push(academicYear);
  }
  
  const totalGrades = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM grades g ${whereClause}`, params
  );
  
  const gradeDistribution = await query<any[]>(`
    SELECT grade, COUNT(*) as count 
    FROM grades g ${whereClause}
    GROUP BY grade 
    ORDER BY count DESC
  `, [...params]);
  
  const topStudents = await query<any[]>(`
    SELECT s.name as student_name, AVG(g.score) as average_score, COUNT(g.id) as total_grades
    FROM grades g
    JOIN students s ON g.student_id = s.id
    ${whereClause}
    GROUP BY g.student_id
    ORDER BY average_score DESC
    LIMIT 10
  `, [...params]);
  
  res.json({
    success: true,
    stats: {
      totalGrades: totalGrades?.count || 0,
      gradeDistribution,
      topStudents
    }
  });
});
