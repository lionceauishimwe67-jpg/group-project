import { query } from '../config/database';

async function checkSubjects() {
  try {
    const subjects = await query<any[]>(`
      SELECT s.id, s.name, COUNT(t.id) as class_count
      FROM subjects s
      LEFT JOIN timetable t ON s.id = t.subject_id AND t.is_active = 1
      GROUP BY s.id, s.name
      ORDER BY s.name
    `);

    console.log('Subjects in database:');
    console.table(subjects);

    console.log(`\nTotal subjects: ${subjects.length}`);
    console.log(`Total scheduled classes: ${subjects.reduce((sum, s) => sum + s.class_count, 0)}`);

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSubjects();
