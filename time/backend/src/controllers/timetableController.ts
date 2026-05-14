import { Request, Response } from 'express';
import { query, run, withTransaction } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { TimetableEntry, TimetableEntryWithDetails, CurrentSession } from '../types';
import * as XLSX from 'xlsx';
import { sendSMSToTeachers } from '../services/smsService';

// Get current sessions (for display screen)
export const getCurrentSessions = asyncHandler(async (req: Request, res: Response) => {
  const { classId, level } = req.query;

  // Get current time and day
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD

  // Check if within school hours (8:10 AM to 5:00 PM) or etude time (6:30 PM to 8:25 PM)
  const schoolStart = '08:10:00';
  const schoolEnd = '17:00:00';
  const etudeStart = '18:30:00';
  const etudeEnd = '20:25:00';
  
  const isSchoolHours = currentTime >= schoolStart && currentTime <= schoolEnd;
  const isEtudeTime = currentTime >= etudeStart && currentTime <= etudeEnd;
  
  if (!isSchoolHours && !isEtudeTime) {
    return res.json({
      success: true,
      data: [],
      meta: {
        count: 0,
        message: 'Outside school hours (8:10 AM - 5:00 PM) and etude time (6:30 PM - 8:25 PM)'
      }
    });
  }

  let sql = `
    SELECT 
      t.id,
      t.class_id,
      c.name AS class_name,
      t.subject_id,
      s.name AS subject_name,
      t.teacher_id,
      te.name AS teacher_name,
      t.classroom_id,
      cl.name AS classroom_name,
      substr(t.start_time, 1, 5) AS start_time,
      substr(t.end_time, 1, 5) AS end_time,
      t.is_temporary,
      t.temporary_date
    FROM timetable t
    JOIN classes c ON t.class_id = c.id
    JOIN subjects s ON t.subject_id = s.id
    JOIN teachers te ON t.teacher_id = te.id
    JOIN classrooms cl ON t.classroom_id = cl.id
    WHERE t.is_active = 1
      AND t.day_of_week = ?
      AND (
        -- Regular session (not temporary)
        (t.is_temporary = 0)
        OR
        -- Temporary session for today
        (t.is_temporary = 1 AND t.temporary_date = ?)
      )
      AND t.start_time <= ? AND t.end_time >= ?
  `;

  const params: any[] = [currentDay, currentDate, currentTime, currentTime];

  // Add filtering
  if (classId) {
    sql += ' AND t.class_id = ?';
    params.push(classId);
  }

  if (level) {
    sql += ' AND c.level = ?';
    params.push(level);
  }

  sql += ' ORDER BY c.level, c.name, t.start_time';

  const sessions = await query<CurrentSession[]>(sql, params);

  return res.json({
    success: true,
    data: sessions,
    meta: {
      current_time: currentTime,
      current_day: currentDay,
      current_date: currentDate,
      count: sessions.length
    }
  });
});

// Get full timetable (for admin)
export const getTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { classId, dayOfWeek, isTemporary } = req.query;

  let sql = `
    SELECT 
      t.id,
      t.class_id,
      c.name AS class_name,
      t.subject_id,
      s.name AS subject_name,
      t.teacher_id,
      te.name AS teacher_name,
      t.classroom_id,
      cl.name AS classroom_name,
      substr(t.start_time, 1, 5) AS start_time,
      substr(t.end_time, 1, 5) AS end_time,
      t.day_of_week,
      t.is_temporary,
      t.temporary_date,
      t.is_active,
      t.created_at,
      t.updated_at
    FROM timetable t
    JOIN classes c ON t.class_id = c.id
    JOIN subjects s ON t.subject_id = s.id
    JOIN teachers te ON t.teacher_id = te.id
    JOIN classrooms cl ON t.classroom_id = cl.id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (classId) {
    sql += ' AND t.class_id = ?';
    params.push(classId);
  }

  if (dayOfWeek !== undefined) {
    sql += ' AND t.day_of_week = ?';
    params.push(dayOfWeek);
  }

  if (isTemporary !== undefined) {
    sql += ' AND t.is_temporary = ?';
    params.push(isTemporary === 'true' ? 1 : 0);
  }

  sql += ' ORDER BY t.day_of_week, t.start_time, c.name';

  const entries = await query<TimetableEntryWithDetails[]>(sql, params);

  return res.json({
    success: true,
    data: entries,
    meta: {
      count: entries.length
    }
  });
});

// Get single timetable entry
export const getTimetableEntry = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const entries = await query<TimetableEntryWithDetails[]>(`
    SELECT 
      t.id,
      t.class_id,
      c.name AS class_name,
      t.subject_id,
      s.name AS subject_name,
      t.teacher_id,
      te.name AS teacher_name,
      t.classroom_id,
      cl.name AS classroom_name,
      substr(t.start_time, 1, 5) AS start_time,
      substr(t.end_time, 1, 5) AS end_time,
      t.day_of_week,
      t.is_temporary,
      t.temporary_date,
      t.is_active,
      t.created_at,
      t.updated_at
    FROM timetable t
    JOIN classes c ON t.class_id = c.id
    JOIN subjects s ON t.subject_id = s.id
    JOIN teachers te ON t.teacher_id = te.id
    JOIN classrooms cl ON t.classroom_id = cl.id
    WHERE t.id = ?
  `, [id]);

  if (entries.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Timetable entry not found'
    });
  }

  return res.json({
    success: true,
    data: entries[0]
  });
});

// Create timetable entry
export const createTimetableEntry = asyncHandler(async (req: Request, res: Response) => {
  const {
    class_name,
    subject_name,
    teacher_name,
    classroom_name,
    start_time,
    end_time,
    day_of_week,
    is_temporary = false,
    temporary_date = null
  } = req.body;

  // Validate required fields
  if (!class_name || !subject_name || !teacher_name || !classroom_name || 
      !start_time || !end_time || day_of_week === undefined) {
    return res.status(400).json({
      success: false,
      error: 'All fields are required: class_name, subject_name, teacher_name, classroom_name, start_time, end_time, day_of_week'
    });
  }

  // Validate time format
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid time format. Use HH:MM format'
    });
  }

  // If temporary, require temporary_date
  if (is_temporary && !temporary_date) {
    return res.status(400).json({
      success: false,
      error: 'Temporary sessions require a temporary_date'
    });
  }

  try {
    // Find or create class
    let classRecord = await query<{ id: number }[]>(
      'SELECT id FROM classes WHERE name = ?',
      [class_name.trim()]
    );
    
    let classId: number;
    if (classRecord.length === 0) {
      // Extract level from class name (e.g., "L1A" -> "L1")
      const levelMatch = class_name.trim().match(/^(L\d|S\d|Other)/);
      const level = levelMatch ? levelMatch[1] : 'Other';
      
      // Create new class
      const newClass = await run(
        'INSERT INTO classes (name, level) VALUES (?, ?)',
        [class_name.trim(), level]
      );
      classId = newClass.lastID;
    } else {
      classId = classRecord[0].id;
    }

    // Find or create subject
    let subject = await query<{ id: number }[]>(
      'SELECT id FROM subjects WHERE name = ?',
      [subject_name.trim()]
    );
    
    let subjectId: number;
    if (subject.length === 0) {
      // Create new subject
      const newSubject = await run(
        'INSERT INTO subjects (name) VALUES (?)',
        [subject_name.trim()]
      );
      subjectId = newSubject.lastID;
    } else {
      subjectId = subject[0].id;
    }

    // Find or create teacher
    let teacher = await query<{ id: number }[]>(
      'SELECT id FROM teachers WHERE name = ?',
      [teacher_name.trim()]
    );
    
    let teacherId: number;
    if (teacher.length === 0) {
      // Create new teacher
      const newTeacher = await run(
        'INSERT INTO teachers (name) VALUES (?)',
        [teacher_name.trim()]
      );
      teacherId = newTeacher.lastID;
    } else {
      teacherId = teacher[0].id;
    }

    // Find or create classroom
    let classroom = await query<{ id: number }[]>(
      'SELECT id FROM classrooms WHERE name = ?',
      [classroom_name.trim()]
    );
    
    let classroomId: number;
    if (classroom.length === 0) {
      // Create new classroom
      const newClassroom = await run(
        'INSERT INTO classrooms (name) VALUES (?)',
        [classroom_name.trim()]
      );
      classroomId = newClassroom.lastID;
    } else {
      classroomId = classroom[0].id;
    }

    const result = await run(`
      INSERT INTO timetable 
        (class_id, subject_id, teacher_id, classroom_id, start_time, end_time, day_of_week, is_temporary, temporary_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      classId, subjectId, teacherId, classroomId,
      start_time, end_time, day_of_week,
      is_temporary ? 1 : 0, temporary_date
    ]);

    // Fetch the created entry
    const entries = await query<TimetableEntryWithDetails[]>(`
      SELECT 
        t.id,
        t.class_id,
        c.name AS class_name,
        t.subject_id,
        s.name AS subject_name,
        t.teacher_id,
        te.name AS teacher_name,
        t.classroom_id,
        cl.name AS classroom_name,
        substr(t.start_time, 1, 5) AS start_time,
        substr(t.end_time, 1, 5) AS end_time,
        t.day_of_week,
        t.is_temporary,
        t.temporary_date,
        t.is_active,
        t.created_at,
        t.updated_at
      FROM timetable t
      JOIN classes c ON t.class_id = c.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN teachers te ON t.teacher_id = te.id
      JOIN classrooms cl ON t.classroom_id = cl.id
      WHERE t.id = ?
    `, [result.lastID]);

    // Send SMS notification for timetable change
    const smsMessage = `Timetable Updated: ${subject_name} added for ${class_name} on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day_of_week]} ${start_time}-${end_time}`;
    sendSMSToTeachers(smsMessage, 'timetable').catch((err: Error) => {
      console.error('Failed to send SMS for timetable change:', err);
    });

    return res.status(201).json({
      success: true,
      data: entries[0],
      message: 'Timetable entry created successfully'
    });
  } catch (error: any) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        error: 'Invalid reference: class, subject, teacher, or classroom does not exist'
      });
    }
    throw error;
  }
});

// Update timetable entry
export const updateTimetableEntry = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  // Check if entry exists
  const existing = await query<TimetableEntry[]>('SELECT * FROM timetable WHERE id = ?', [id]);

  if (existing.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Timetable entry not found'
    });
  }

  // Handle text fields and convert to IDs
  let classId: number | undefined;
  if (updates.class_name !== undefined) {
    let classRecord = await query<{ id: number }[]>(
      'SELECT id FROM classes WHERE name = ?',
      [updates.class_name.trim()]
    );
    if (classRecord.length === 0) {
      // Extract level from class name (e.g., "L1A" -> "L1")
      const levelMatch = updates.class_name.trim().match(/^(L\d|S\d|Other)/);
      const level = levelMatch ? levelMatch[1] : 'Other';
      
      const newClass = await query<{ insertId: number }>(
        'INSERT INTO classes (name, level) VALUES (?, ?)',
        [updates.class_name.trim(), level]
      );
      classId = newClass.insertId;
    } else {
      classId = classRecord[0].id;
    }
  }

  let subjectId: number | undefined;
  if (updates.subject_name !== undefined) {
    let subject = await query<{ id: number }[]>(
      'SELECT id FROM subjects WHERE name = ?',
      [updates.subject_name.trim()]
    );
    if (subject.length === 0) {
      const newSubject = await query<{ insertId: number }>(
        'INSERT INTO subjects (name) VALUES (?)',
        [updates.subject_name.trim()]
      );
      subjectId = newSubject.insertId;
    } else {
      subjectId = subject[0].id;
    }
  }

  let teacherId: number | undefined;
  if (updates.teacher_name !== undefined) {
    let teacher = await query<{ id: number }[]>(
      'SELECT id FROM teachers WHERE name = ?',
      [updates.teacher_name.trim()]
    );
    if (teacher.length === 0) {
      const newTeacher = await query<{ insertId: number }>(
        'INSERT INTO teachers (name) VALUES (?)',
        [updates.teacher_name.trim()]
      );
      teacherId = newTeacher.insertId;
    } else {
      teacherId = teacher[0].id;
    }
  }

  let classroomId: number | undefined;
  if (updates.classroom_name !== undefined) {
    let classroom = await query<{ id: number }[]>(
      'SELECT id FROM classrooms WHERE name = ?',
      [updates.classroom_name.trim()]
    );
    if (classroom.length === 0) {
      const newClassroom = await query<{ insertId: number }>(
        'INSERT INTO classrooms (name) VALUES (?)',
        [updates.classroom_name.trim()]
      );
      classroomId = newClassroom.insertId;
    } else {
      classroomId = classroom[0].id;
    }
  }

  // Build update fields
  const allowedFields = [
    'start_time', 'end_time', 'day_of_week',
    'is_temporary', 'temporary_date', 'is_active'
  ];

  const updateFields: string[] = [];
  const values: any[] = [];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateFields.push(`${field} = ?`);
      values.push(field === 'is_temporary' || field === 'is_active' 
        ? (updates[field] ? 1 : 0) 
        : updates[field]);
    }
  }

  // Add ID fields if text names were provided
  if (classId !== undefined) {
    updateFields.push('class_id = ?');
    values.push(classId);
  }
  if (subjectId !== undefined) {
    updateFields.push('subject_id = ?');
    values.push(subjectId);
  }
  if (teacherId !== undefined) {
    updateFields.push('teacher_id = ?');
    values.push(teacherId);
  }
  if (classroomId !== undefined) {
    updateFields.push('classroom_id = ?');
    values.push(classroomId);
  }

  if (updateFields.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No valid fields to update'
    });
  }

  values.push(id);

  await query(
    `UPDATE timetable SET ${updateFields.join(', ')} WHERE id = ?`,
    values
  );

  // Fetch updated entry
  const entries = await query<TimetableEntryWithDetails[]>(`
    SELECT 
      t.id,
      t.class_id,
      c.name AS class_name,
      t.subject_id,
      s.name AS subject_name,
      t.teacher_id,
      te.name AS teacher_name,
      t.classroom_id,
      cl.name AS classroom_name,
      substr(t.start_time, 1, 5) AS start_time,
      substr(t.end_time, 1, 5) AS end_time,
      t.day_of_week,
      t.is_temporary,
      t.temporary_date,
      t.is_active,
      t.created_at,
      t.updated_at
    FROM timetable t
    JOIN classes c ON t.class_id = c.id
    JOIN subjects s ON t.subject_id = s.id
    JOIN teachers te ON t.teacher_id = te.id
    JOIN classrooms cl ON t.classroom_id = cl.id
    WHERE t.id = ?
  `, [id]);

  return res.json({
    success: true,
    data: entries[0],
    message: 'Timetable entry updated successfully'
  });
});

// Delete timetable entry
export const deleteTimetableEntry = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if entry exists
  const existing = await query<TimetableEntry[]>('SELECT * FROM timetable WHERE id = ?', [id]);

  if (existing.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Timetable entry not found'
    });
  }

  await query('DELETE FROM timetable WHERE id = ?', [id]);

  return res.json({
    success: true,
    message: 'Timetable entry deleted successfully'
  });
});

// Delete all timetable entries
export const deleteAllTimetableEntries = asyncHandler(async (req: Request, res: Response) => {
  const result = await run('DELETE FROM timetable');

  return res.json({
    success: true,
    message: `All ${result.changes} timetable entries deleted successfully`,
    data: { deletedCount: result.changes }
  });
});

// Bulk save timetable entries (replace all entries for a class)
export const bulkSaveTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { classId, entries } = req.body;

  if (!classId || !Array.isArray(entries)) {
    return res.status(400).json({
      success: false,
      error: 'classId and entries array are required'
    });
  }

  try {
    // Delete existing entries for this class
    await run('DELETE FROM timetable WHERE class_id = ?', [classId]);

    // Insert new entries
    let insertedCount = 0;
    for (const entry of entries) {
      const { subject_id, teacher_id, classroom_id, start_time, end_time, day_of_week } = entry;
      
      if (!subject_id || !start_time || !end_time || day_of_week === undefined) {
        continue;
      }

      await run(
        `INSERT INTO timetable (class_id, subject_id, teacher_id, classroom_id, start_time, end_time, day_of_week, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [classId, subject_id, teacher_id || null, classroom_id || null, start_time, end_time, day_of_week]
      );
      insertedCount++;
    }

    return res.json({
      success: true,
      message: `Saved ${insertedCount} timetable entries for class`,
      data: { insertedCount }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get reference data (classes, teachers, subjects, classrooms)
export const getReferenceData = asyncHandler(async (req: Request, res: Response) => {
  const [classes, teachers, subjects, classrooms] = await Promise.all([
    query('SELECT * FROM classes ORDER BY level, name'),
    query('SELECT * FROM teachers ORDER BY name'),
    query('SELECT * FROM subjects ORDER BY name'),
    query('SELECT * FROM classrooms ORDER BY name')
  ]);

  return res.json({
    success: true,
    data: {
      classes,
      teachers,
      subjects,
      classrooms
    }
  });
});

// Get weekly timetable
export const getWeeklyTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { classId, level } = req.query;

  let sql = `
    SELECT 
      t.id,
      t.class_id,
      c.name AS class_name,
      t.subject_id,
      s.name AS subject_name,
      t.teacher_id,
      te.name AS teacher_name,
      t.classroom_id,
      cl.name AS classroom_name,
      substr(t.start_time, 1, 5) AS start_time,
      substr(t.end_time, 1, 5) AS end_time,
      t.day_of_week,
      t.is_temporary,
      t.temporary_date,
      t.is_active,
      t.created_at,
      t.updated_at
    FROM timetable t
    JOIN classes c ON t.class_id = c.id
    JOIN subjects s ON t.subject_id = s.id
    JOIN teachers te ON t.teacher_id = te.id
    JOIN classrooms cl ON t.classroom_id = cl.id
    WHERE t.is_active = 1
      AND (
        -- Regular session (not temporary)
        (t.is_temporary = 0)
        OR
        -- Temporary session for today
        (t.is_temporary = 1 AND t.temporary_date = date('now'))
      )
  `;

  const params: any[] = [];

  // Add filtering
  if (classId) {
    sql += ' AND t.class_id = ?';
    params.push(classId);
  }

  if (level) {
    sql += ' AND c.level = ?';
    params.push(level);
  }

  sql += ' ORDER BY t.day_of_week, t.start_time, c.name';

  const entries = await query<TimetableEntryWithDetails[]>(sql, params);

  // Group by day of week
  const weeklyData: Record<number, TimetableEntryWithDetails[]> = {
    0: [], // Sunday
    1: [], // Monday
    2: [], // Tuesday
    3: [], // Wednesday
    4: [], // Thursday
    5: [], // Friday
    6: []  // Saturday
  };

  entries.forEach(entry => {
    if (weeklyData[entry.day_of_week]) {
      weeklyData[entry.day_of_week].push(entry);
    }
  });

  return res.json({
    success: true,
    data: weeklyData,
    meta: {
      count: entries.length
    }
  });
});

// Batch import timetable entries from Excel
export const batchImportTimetable = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    let importedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    const dayMap: Record<string, number> = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 0
    };

    await withTransaction(async (db) => {
      for (const row of data) {
        try {
          const rowAny = row as any;
          const className = rowAny['Class'] || rowAny['class'];
          const subjectName = rowAny['Subject'] || rowAny['subject'];
          const teacherName = rowAny['Teacher'] || rowAny['teacher'];
          const classroomName = rowAny['Classroom'] || rowAny['classroom'] || rowAny['Room'] || rowAny['room'];
          const startTime = rowAny['Start Time'] || rowAny['start_time'] || rowAny['StartTime'];
          const endTime = rowAny['End Time'] || rowAny['end_time'] || rowAny['EndTime'];
          const dayOfWeek = rowAny['Day'] || rowAny['day'] || rowAny['Day of Week'];

          if (!className || !subjectName || !startTime || !endTime || !dayOfWeek) {
            errors.push(`Missing required fields in row: ${JSON.stringify(row)}`);
            errorCount++;
            continue;
          }

          // Get or create class
          const classResult = await run(
            'INSERT OR IGNORE INTO classes (name, level) VALUES (?, ?)',
            [className, 'Unknown']
          );
          const classId = classResult.lastID || (await query<{ id: number }[]>('SELECT id FROM classes WHERE name = ?', [className]))[0].id;

          // Get or create subject
          const subjectResult = await run(
            'INSERT OR IGNORE INTO subjects (name) VALUES (?)',
            [subjectName]
          );
          const subjectId = subjectResult.lastID || (await query<{ id: number }[]>('SELECT id FROM subjects WHERE name = ?', [subjectName]))[0].id;

          // Get or create teacher
          let teacherId = null;
          if (teacherName) {
            const teacherResult = await run(
              'INSERT OR IGNORE INTO teachers (name, email, phone) VALUES (?, ?, ?)',
              [teacherName, `${teacherName.toLowerCase().replace(/\s/g, '.')}@school.com`, '+250000000000']
            );
            teacherId = teacherResult.lastID || (await query<{ id: number }[]>('SELECT id FROM teachers WHERE name = ?', [teacherName]))[0].id;
          }

          // Get or create classroom
          const finalClassroomName = classroomName || `${className} Room`;
          const classroomResult = await run(
            'INSERT OR IGNORE INTO classrooms (name, capacity) VALUES (?, ?)',
            [finalClassroomName, 30]
          );
          const classroomId = classroomResult.lastID || (await query<{ id: number }[]>('SELECT id FROM classrooms WHERE name = ?', [finalClassroomName]))[0].id;

          // Insert timetable entry
          const dayValue = dayMap[dayOfWeek as string];
          if (dayValue === undefined) {
            errors.push(`Invalid day: ${dayOfWeek} in row: ${JSON.stringify(row)}`);
            errorCount++;
            continue;
          }

          await run(
            `INSERT OR REPLACE INTO timetable 
             (class_id, subject_id, teacher_id, classroom_id, start_time, end_time, day_of_week, is_active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [classId, subjectId, teacherId, classroomId, startTime, endTime, dayValue]
          );

          // Add teacher-subject relationship if teacher exists
          if (teacherId) {
            await run(
              'INSERT OR IGNORE INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)',
              [teacherId, subjectId]
            );
          }

          importedCount++;
        } catch (error: any) {
          errors.push(`Error importing row: ${error.message}`);
          errorCount++;
        }
      }
    });

    return res.json({
      success: true,
      data: {
        imported: importedCount,
        errors: errorCount,
        errorDetails: errors
      },
      message: `Imported ${importedCount} entries successfully${errorCount > 0 ? ` with ${errorCount} errors` : ''}`
    });
  } catch (error: any) {
    console.error('Batch import error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to import timetable data'
    });
  }
});
