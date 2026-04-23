import { query } from '../config/database';

/**
 * Migration script to add notification-related fields to the database
 * Run this after updating the schema.sql file
 */

const migrateNotifications = async () => {
  try {
    console.log('Starting notification system migration...');

    // Check if device_token column exists in teachers table
    const teachersTableInfo = await query<any[]>(
      "PRAGMA table_info(teachers)"
    );
    
    const hasDeviceToken = teachersTableInfo.some(col => col.name === 'device_token');
    const hasNotificationEnabled = teachersTableInfo.some(col => col.name === 'notification_enabled');
    const hasNotificationAdvanceMinutes = teachersTableInfo.some(col => col.name === 'notification_advance_minutes');
    const hasUserId = teachersTableInfo.some(col => col.name === 'user_id');

    // Add missing columns to teachers table
    if (!hasDeviceToken) {
      console.log('Adding device_token column to teachers table...');
      await query(
        'ALTER TABLE teachers ADD COLUMN device_token VARCHAR(500)'
      );
    }

    if (!hasNotificationEnabled) {
      console.log('Adding notification_enabled column to teachers table...');
      await query(
        'ALTER TABLE teachers ADD COLUMN notification_enabled BOOLEAN DEFAULT 1'
      );
    }

    if (!hasNotificationAdvanceMinutes) {
      console.log('Adding notification_advance_minutes column to teachers table...');
      await query(
        'ALTER TABLE teachers ADD COLUMN notification_advance_minutes INT DEFAULT 15'
      );
    }

    if (!hasUserId) {
      console.log('Adding user_id column to teachers table...');
      await query(
        'ALTER TABLE teachers ADD COLUMN user_id INT'
      );
      // Add foreign key constraint (SQLite doesn't support ALTER TABLE ADD FOREIGN KEY directly, so we'll add it without constraint for now)
    }

    // Check if notifications table exists
    const tables = await query<any[]>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='notifications'"
    );

    if (tables.length === 0) {
      console.log('Creating notifications table...');
      await query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          teacher_id INTEGER NOT NULL,
          timetable_id INTEGER NOT NULL,
          notification_type TEXT DEFAULT 'class_reminder',
          title VARCHAR(200) NOT NULL,
          body TEXT NOT NULL,
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'pending',
          error_message TEXT,
          FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
          FOREIGN KEY (timetable_id) REFERENCES timetable(id) ON DELETE CASCADE
        )
      `);

      // Create indexes
      await query('CREATE INDEX IF NOT EXISTS idx_notifications_teacher ON notifications(teacher_id)');
      await query('CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at)');
      await query('CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status)');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
migrateNotifications();
