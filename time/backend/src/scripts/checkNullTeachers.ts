import { query } from '../config/database';

async function checkNullTeachers() {
  try {
    const nullTeachers = await query<any[]>(`
      SELECT id, class_id, subject_id, start_time, end_time, day_of_week
      FROM timetable
      WHERE teacher_id IS NULL AND is_active = 1
    `);
    
    console.log('Timetable entries with null teacher_id:', nullTeachers.length);
    if (nullTeachers.length > 0) {
      console.table(nullTeachers.slice(0, 20));
    }

    // Also check if there are entries with teacher_id that don't exist
    const invalidTeachers = await query<any[]>(`
      SELECT t.id, t.teacher_id, c.name as class_name, s.name as subject_name
      FROM timetable t
      JOIN classes c ON t.class_id = c.id
      JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN teachers te ON t.teacher_id = te.id
      WHERE t.is_active = 1 AND te.id IS NULL AND t.teacher_id IS NOT NULL
    `);
    
    console.log('\nTimetable entries with invalid teacher_id:', invalidTeachers.length);
    if (invalidTeachers.length > 0) {
      console.table(invalidTeachers.slice(0, 20));
    }

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkNullTeachers();
