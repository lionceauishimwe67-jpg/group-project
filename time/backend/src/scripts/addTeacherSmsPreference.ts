import { query, run } from '../config/database';

async function addTeacherSmsPreference() {
  try {
    console.log('Adding sms_notification_enabled field to teachers table...');
    
    await query(`
      ALTER TABLE teachers ADD COLUMN sms_notification_enabled INTEGER DEFAULT 1
    `);
    
    console.log('SMS notification preference field added successfully');
    process.exit(0);
  } catch (error: any) {
    if (error.message.includes('duplicate column')) {
      console.log('Field already exists');
      process.exit(0);
    }
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addTeacherSmsPreference();
