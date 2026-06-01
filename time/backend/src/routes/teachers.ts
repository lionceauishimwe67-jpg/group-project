import { Router } from 'express';
import { query, run } from '../config/database';

const router = Router();

// Get all teachers with their assigned subjects and classes
router.get('/', async (req, res) => {
  try {
    const teachers = await query<any[]>('SELECT * FROM teachers ORDER BY name');
    
    // Fetch subject assignments
    const teacherSubjects = await query<any[]>(`
      SELECT ts.teacher_id, s.id as subject_id, s.name as subject_name, s.code as subject_code
      FROM teacher_subjects ts
      JOIN subjects s ON ts.subject_id = s.id
      ORDER BY ts.teacher_id, s.name
    `);
    
    // Fetch class assignments
    const teacherClasses = await query<any[]>(`
      SELECT tc.teacher_id, c.id as class_id, c.name as class_name, c.level as class_level
      FROM teacher_classes tc
      JOIN classes c ON tc.class_id = c.id
      ORDER BY tc.teacher_id, c.name
    `);

    const teacherRooms = await query<any[]>(`
      SELECT tr.teacher_id, cl.id as classroom_id, cl.name as classroom_name, cl.location as classroom_location
      FROM teacher_classrooms tr
      JOIN classrooms cl ON tr.classroom_id = cl.id
      ORDER BY tr.teacher_id, cl.name
    `);
    
    // Group by teacher
    const subjectsByTeacher = new Map<number, any[]>();
    for (const ts of teacherSubjects) {
      if (!subjectsByTeacher.has(ts.teacher_id)) subjectsByTeacher.set(ts.teacher_id, []);
      subjectsByTeacher.get(ts.teacher_id)!.push({ id: ts.subject_id, name: ts.subject_name, code: ts.subject_code });
    }
    
    const classesByTeacher = new Map<number, any[]>();
    for (const tc of teacherClasses) {
      if (!classesByTeacher.has(tc.teacher_id)) classesByTeacher.set(tc.teacher_id, []);
      classesByTeacher.get(tc.teacher_id)!.push({ id: tc.class_id, name: tc.class_name, level: tc.class_level });
    }

    const roomsByTeacher = new Map<number, any[]>();
    for (const tr of teacherRooms) {
      if (!roomsByTeacher.has(tr.teacher_id)) roomsByTeacher.set(tr.teacher_id, []);
      roomsByTeacher.get(tr.teacher_id)!.push({ id: tr.classroom_id, name: tr.classroom_name, location: tr.classroom_location });
    }
    
    const teachersWithAssignments = teachers.map(t => ({
      ...t,
      assignedSubjects: subjectsByTeacher.get(t.id) || [],
      assignedClasses: classesByTeacher.get(t.id) || [],
      assignedRooms: roomsByTeacher.get(t.id) || []
    }));
    
    res.json({ teachers: teachersWithAssignments });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Error fetching teachers', error });
  }
});

// Get all classrooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await query<any[]>('SELECT id, name, location, capacity FROM classrooms ORDER BY name');
    res.json({ rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Error fetching rooms', error });
  }
});

// Get all subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await query<any[]>('SELECT id, name, code FROM subjects ORDER BY name');
    res.json({ subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Error fetching subjects', error });
  }
});

// Get all classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await query<any[]>('SELECT id, name, level FROM classes ORDER BY name');
    res.json({ classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Error fetching classes', error });
  }
});

// Get subjects for a specific teacher
router.get('/:id/subjects', async (req, res) => {
  try {
    const subjects = await query<any[]>(`
      SELECT s.id, s.name, s.code
      FROM teacher_subjects ts
      JOIN subjects s ON ts.subject_id = s.id
      WHERE ts.teacher_id = ?
      ORDER BY s.name
    `, [req.params.id]);
    res.json({ subjects });
  } catch (error) {
    console.error('Error fetching teacher subjects:', error);
    res.status(500).json({ message: 'Error fetching teacher subjects', error });
  }
});

// Get classes for a specific teacher
router.get('/:id/classes', async (req, res) => {
  try {
    const classes = await query<any[]>(`
      SELECT c.id, c.name, c.level
      FROM teacher_classes tc
      JOIN classes c ON tc.class_id = c.id
      WHERE tc.teacher_id = ?
      ORDER BY c.name
    `, [req.params.id]);
    res.json({ classes });
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ message: 'Error fetching teacher classes', error });
  }
});

// Get rooms for a specific teacher
router.get('/:id/rooms', async (req, res) => {
  try {
    const rooms = await query<any[]>(`
      SELECT cl.id, cl.name, cl.location, cl.capacity
      FROM teacher_classrooms tr
      JOIN classrooms cl ON tr.classroom_id = cl.id
      WHERE tr.teacher_id = ?
      ORDER BY cl.name
    `, [req.params.id]);
    res.json({ rooms });
  } catch (error) {
    console.error('Error fetching teacher rooms:', error);
    res.status(500).json({ message: 'Error fetching teacher rooms', error });
  }
});

// Assign multiple subjects to a teacher
router.post('/:id/subjects', async (req, res) => {
  try {
    const { subjectIds } = req.body;
    if (!Array.isArray(subjectIds)) return res.status(400).json({ message: 'subjectIds must be an array' });
    await run('DELETE FROM teacher_subjects WHERE teacher_id = ?', [req.params.id]);
    for (const subjectId of subjectIds) {
      await run('INSERT OR IGNORE INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)', [req.params.id, subjectId]);
    }
    res.json({ message: 'Subjects assigned successfully' });
  } catch (error) {
    console.error('Error assigning subjects:', error);
    res.status(500).json({ message: 'Error assigning subjects', error });
  }
});

// Assign multiple classes to a teacher
router.post('/:id/classes', async (req, res) => {
  try {
    const { classIds } = req.body;
    if (!Array.isArray(classIds)) return res.status(400).json({ message: 'classIds must be an array' });
    await run('DELETE FROM teacher_classes WHERE teacher_id = ?', [req.params.id]);
    for (const classId of classIds) {
      await run('INSERT OR IGNORE INTO teacher_classes (teacher_id, class_id) VALUES (?, ?)', [req.params.id, classId]);
    }
    res.json({ message: 'Classes assigned successfully' });
  } catch (error) {
    console.error('Error assigning classes:', error);
    res.status(500).json({ message: 'Error assigning classes', error });
  }
});

// Assign multiple rooms to a teacher
router.post('/:id/rooms', async (req, res) => {
  try {
    const { roomIds } = req.body;
    if (!Array.isArray(roomIds)) return res.status(400).json({ message: 'roomIds must be an array' });
    await run('DELETE FROM teacher_classrooms WHERE teacher_id = ?', [req.params.id]);
    for (const roomId of roomIds) {
      await run('INSERT OR IGNORE INTO teacher_classrooms (teacher_id, classroom_id) VALUES (?, ?)', [req.params.id, roomId]);
    }
    res.json({ message: 'Rooms assigned successfully' });
  } catch (error) {
    console.error('Error assigning rooms:', error);
    res.status(500).json({ message: 'Error assigning rooms', error });
  }
});

// Add a single subject to a teacher
router.post('/:id/subjects/add', async (req, res) => {
  try {
    const { subjectId } = req.body;
    if (!subjectId) return res.status(400).json({ message: 'subjectId is required' });
    await run('INSERT OR IGNORE INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)', [req.params.id, subjectId]);
    res.json({ message: 'Subject added successfully' });
  } catch (error) {
    console.error('Error adding subject:', error);
    res.status(500).json({ message: 'Error adding subject', error });
  }
});

// Remove a subject from a teacher
router.delete('/:id/subjects/:subjectId', async (req, res) => {
  try {
    await run('DELETE FROM teacher_subjects WHERE teacher_id = ? AND subject_id = ?', [req.params.id, req.params.subjectId]);
    res.json({ message: 'Subject removed successfully' });
  } catch (error) {
    console.error('Error removing subject:', error);
    res.status(500).json({ message: 'Error removing subject', error });
  }
});

// Remove a class from a teacher
router.delete('/:id/classes/:classId', async (req, res) => {
  try {
    await run('DELETE FROM teacher_classes WHERE teacher_id = ? AND class_id = ?', [req.params.id, req.params.classId]);
    res.json({ message: 'Class removed successfully' });
  } catch (error) {
    console.error('Error removing class:', error);
    res.status(500).json({ message: 'Error removing class', error });
  }
});

// Remove a room from a teacher
router.delete('/:id/rooms/:roomId', async (req, res) => {
  try {
    await run('DELETE FROM teacher_classrooms WHERE teacher_id = ? AND classroom_id = ?', [req.params.id, req.params.roomId]);
    res.json({ message: 'Room removed successfully' });
  } catch (error) {
    console.error('Error removing room:', error);
    res.status(500).json({ message: 'Error removing room', error });
  }
});

// Create or update teacher profile
router.post('/', async (req, res) => {
  const { id, name, email, phone, school, teaching_schedule, subjects, level, specific_competences, general_competences, complementary_competences, sms_notification_enabled } = req.body;

  if (!name) return res.status(400).json({ message: 'Name is required' });

  try {
    if (id) {
      await query(
        `UPDATE teachers SET name = ?, email = ?, phone = ?, school = ?, teaching_schedule = ?, subjects = ?, level = ?, specific_competences = ?, general_competences = ?, complementary_competences = ?, sms_notification_enabled = COALESCE(?, sms_notification_enabled) WHERE id = ?`,
        [name, email, phone, school, teaching_schedule, subjects, level, specific_competences, general_competences, complementary_competences, sms_notification_enabled, id]
      );
      res.json({ message: 'Teacher updated successfully', teacherId: id });
    } else {
      const result = await query<{ insertId: number }>(
        `INSERT INTO teachers (name, email, phone, school, teaching_schedule, subjects, level, specific_competences, general_competences, complementary_competences, sms_notification_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, email, phone, school, teaching_schedule, subjects, level, specific_competences, general_competences, complementary_competences, sms_notification_enabled || 1]
      );
      res.status(201).json({ message: 'Teacher created successfully', teacherId: result.insertId });
    }
  } catch (error) {
    console.error('Error saving teacher:', error);
    res.status(500).json({ message: 'Error saving teacher', error });
  }
});

// Delete a teacher
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await run('DELETE FROM teacher_subjects WHERE teacher_id = ?', [id]);
    await run('DELETE FROM teacher_classes WHERE teacher_id = ?', [id]);
    await run('DELETE FROM teacher_classrooms WHERE teacher_id = ?', [id]);
    const result = await query<{ changes: number }>('DELETE FROM teachers WHERE id = ?', [id]);
    if (result.changes === 0) return res.status(404).json({ message: 'Teacher not found' });
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ message: 'Error deleting teacher', error });
  }
});

export default router;
