import { query } from '../config/database';

async function checkTeachers() {
  try {
    const teachers = await query<any[]>(`SELECT id, name FROM teachers`);
    console.log('Teachers in database:', teachers.length);
    if (teachers.length > 0) {
      console.table(teachers.slice(0, 10));
    }

    const timetable = await query<any[]>(`
      SELECT DISTINCT t.teacher_id, te.name as teacher_name
      FROM timetable t
      LEFT JOIN teachers te ON t.teacher_id = te.id
      WHERE t.is_active = 1
    `);
    console.log('\nUnique teacher IDs in timetable:', timetable.length);
    console.table(timetable.slice(0, 10));

    const missingTeachers = timetable.filter(t => !teachers.find((teach: any) => teach.id === t.teacher_id));
    console.log('\nTeacher IDs in timetable but not in teachers table:', missingTeachers.length);
    if (missingTeachers.length > 0) {
      console.table(missingTeachers.slice(0, 10));
    }

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTeachers();
