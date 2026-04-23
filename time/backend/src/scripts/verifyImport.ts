import { query } from '../config/database';

async function verifyImport() {
  try {
    const count = await query<{ count: number }[]>('SELECT COUNT(*) as count FROM timetable');
    console.log('Timetable entries in database:', count[0].count);

    const classes = await query<{ name: string }[]>('SELECT name FROM classes LIMIT 5');
    console.log('Sample classes:', classes.map(c => c.name));

    const subjects = await query<{ name: string }[]>('SELECT name FROM subjects LIMIT 5');
    console.log('Sample subjects:', subjects.map(s => s.name));

    const teachers = await query<{ name: string }[]>('SELECT name FROM teachers LIMIT 5');
    console.log('Sample teachers:', teachers.map(t => t.name));

    const sampleEntries = await query<any[]>(`
      SELECT t.start_time, t.end_time, t.day_of_week, c.name as class_name, s.name as subject_name, te.name as teacher_name
      FROM timetable t
      JOIN classes c ON t.class_id = c.id
      JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN teachers te ON t.teacher_id = te.id
      LIMIT 5
    `);
    console.log('Sample timetable entries:');
    console.table(sampleEntries);

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verifyImport();
