import { query } from '../config/database';

(async () => {
  try {
    await query('ALTER TABLE timetable ADD COLUMN status TEXT DEFAULT "scheduled"');
    console.log('Status column added');
  } catch (e: any) {
    console.log('Status column may already exist:', e.message);
  }

  try {
    await query('ALTER TABLE timetable ADD COLUMN teacher_checked_in INTEGER DEFAULT 0');
    console.log('Teacher checked in column added');
  } catch (e: any) {
    console.log('Teacher checked in column may already exist:', e.message);
  }

  console.log('Migration complete');
  process.exit(0);
})();
