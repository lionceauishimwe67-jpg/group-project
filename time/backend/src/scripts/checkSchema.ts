import { query } from '../config/database';

async function checkSchema() {
  try {
    const result = await query<any[]>(`PRAGMA table_info(timetable)`);
    console.log('Timetable table schema:');
    console.table(result);
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
