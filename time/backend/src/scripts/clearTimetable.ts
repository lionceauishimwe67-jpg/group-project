import { query } from '../config/database';

async function clearTimetable() {
  try {
    const result = await query<{ count: number }[]>('SELECT COUNT(*) as count FROM timetable');
    console.log('Current timetable entries:', result[0].count);

    await query('DELETE FROM timetable');
    console.log('Cleared all timetable entries');

    const verify = await query<{ count: number }[]>('SELECT COUNT(*) as count FROM timetable');
    console.log('Timetable entries after clear:', verify[0].count);

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

clearTimetable();
