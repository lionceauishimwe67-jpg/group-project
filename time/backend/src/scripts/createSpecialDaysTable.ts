import { query, run } from '../config/database';

async function createSpecialDaysTable() {
  try {
    console.log('Creating special_days table...');
    
    await query(`
      CREATE TABLE IF NOT EXISTS special_days (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        day_type TEXT DEFAULT 'holiday',
        is_school_day INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Special days table created successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createSpecialDaysTable();
