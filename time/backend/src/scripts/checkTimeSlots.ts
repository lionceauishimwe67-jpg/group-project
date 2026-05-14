import { query } from '../config/database';

async function checkTimeSlots() {
  try {
    const entries = await query<any[]>(`
      SELECT DISTINCT substr(start_time, 1, 5) AS start_time, substr(end_time, 1, 5) AS end_time
      FROM timetable
      WHERE is_active = 1
      ORDER BY start_time
    `);
    
    console.log('Unique time slots in database:');
    console.table(entries);

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTimeSlots();
