import { query } from '../config/database';

async function checkTimetableData() {
  try {
    // Get all timetable entries grouped by day
    const entries = await query<any[]>(`
      SELECT 
        t.day_of_week,
        substr(t.start_time, 1, 5) AS start_time,
        substr(t.end_time, 1, 5) AS end_time,
        c.name AS class_name,
        c.level,
        s.name AS subject_name,
        te.name AS teacher_name,
        cl.name AS classroom_name,
        t.is_active
      FROM timetable t
      JOIN classes c ON t.class_id = c.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN teachers te ON t.teacher_id = te.id
      JOIN classrooms cl ON t.classroom_id = cl.id
      WHERE t.is_active = 1
      ORDER BY t.day_of_week, t.start_time, c.name
    `);

    console.log('Total timetable entries:', entries.length);
    console.log('\nEntries by day:');

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    entries.forEach(entry => {
      dayCounts[entry.day_of_week]++;
    });

    Object.keys(dayCounts).forEach(day => {
      console.log(`  ${dayNames[Number(day)]}: ${dayCounts[Number(day)]} entries`);
    });

    console.log('\nSample entries:');
    console.table(entries.slice(0, 20));

    // Get unique classes
    const classes = await query<any[]>(`
      SELECT DISTINCT c.name, c.level
      FROM timetable t
      JOIN classes c ON t.class_id = c.id
      WHERE t.is_active = 1
      ORDER BY c.level, c.name
    `);

    console.log('\nClasses with timetable:');
    console.table(classes);

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTimetableData();
