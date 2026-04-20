import { Router } from 'express';
import { query } from '../config/database';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all teachers
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const teachers = await query<any[]>('SELECT * FROM teachers ORDER BY created_at DESC');
    res.json({ teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Error fetching teachers', error: error });
  }
});

// Create or update teacher profile
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { id, name, email, phone, school, teaching_schedule, subjects } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    if (id) {
      // Update existing teacher
      await query(
        `UPDATE teachers SET name = ?, email = ?, phone = ?, school = ?, teaching_schedule = ?, subjects = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [name, email, phone, school, teaching_schedule, subjects, id]
      );
      res.json({ message: 'Teacher updated successfully', teacherId: id });
    } else {
      // Create new teacher
      const result = await query<{ insertId: number }>(
        `INSERT INTO teachers (name, email, phone, school, teaching_schedule, subjects) VALUES (?, ?, ?, ?, ?, ?)`,
        [name, email, phone, school, teaching_schedule, subjects]
      );
      res.status(201).json({ message: 'Teacher created successfully', teacherId: result.insertId });
    }
  } catch (error) {
    console.error('Error saving teacher:', error);
    res.status(500).json({ message: 'Error saving teacher', error: error });
  }
});

// Delete a teacher
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query<{ changes: number }>('DELETE FROM teachers WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ message: 'Error deleting teacher', error: error });
  }
});

export default router;
