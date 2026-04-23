import { query } from '../config/database';

async function checkTeacherSchema() {
  try {
    // Check teachers table schema
    const schema = await query<any[]>(`PRAGMA table_info(teachers)`);
    console.log('Teachers table schema:');
    console.table(schema);

    // Check if phone and notification_enabled fields exist
    const hasPhone = schema.some((col: any) => col.name === 'phone');
    const hasNotificationEnabled = schema.some((col: any) => col.name === 'notification_enabled');
    
    console.log('\nField check:');
    console.log('  phone field:', hasPhone ? '✓' : '✗');
    console.log('  notification_enabled field:', hasNotificationEnabled ? '✓' : '✗');

    // Check notifications table schema
    const notificationsSchema = await query<any[]>(`PRAGMA table_info(notifications)`);
    console.log('\nNotifications table schema:');
    console.table(notificationsSchema);

    // Check current teachers with phone numbers
    const teachers = await query<any[]>(`SELECT id, name, phone, notification_enabled FROM teachers LIMIT 5`);
    console.log('\nSample teachers:');
    console.table(teachers);

    // Check recent notifications
    const notifications = await query<any[]>(`SELECT * FROM notifications ORDER BY sent_at DESC LIMIT 5`);
    console.log('\nRecent notifications:');
    console.table(notifications);

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTeacherSchema();
