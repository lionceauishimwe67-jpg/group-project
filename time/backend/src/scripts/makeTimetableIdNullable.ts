import { query } from '../config/database';

async function makeTimetableIdNullable() {
  try {
    // SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table
    console.log('Making timetable_id nullable in notifications table...');
    
    // Get current schema
    const schema = await query<any[]>(`PRAGMA table_info(notifications)`);
    console.log('Current schema:');
    console.table(schema);
    
    // Check if timetable_id is already nullable
    const timetableIdCol = schema.find((col: any) => col.name === 'timetable_id');
    if (timetableIdCol && !timetableIdCol.notnull) {
      console.log('timetable_id is already nullable');
      process.exit(0);
    }
    
    // Create new table with nullable timetable_id
    await query(`
      CREATE TABLE notifications_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER,
        timetable_id INTEGER,
        notification_type TEXT DEFAULT 'class_reminder',
        title VARCHAR(200) NOT NULL,
        body TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        sent_via TEXT DEFAULT 'push'
      )
    `);
    
    // Copy data from old table
    await query(`
      INSERT INTO notifications_new (id, teacher_id, timetable_id, notification_type, title, body, sent_at, status, error_message, sent_via)
      SELECT id, teacher_id, timetable_id, notification_type, title, body, sent_at, status, error_message, sent_via
      FROM notifications
    `);
    
    // Drop old table
    await query(`DROP TABLE notifications`);
    
    // Rename new table
    await query(`ALTER TABLE notifications_new RENAME TO notifications`);
    
    console.log('✓ Made timetable_id nullable in notifications table');
    
    // Verify
    const updatedSchema = await query<any[]>(`PRAGMA table_info(notifications)`);
    console.log('\nUpdated schema:');
    console.table(updatedSchema);
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

makeTimetableIdNullable();
