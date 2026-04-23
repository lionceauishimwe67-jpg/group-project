import { query } from '../config/database';

async function addSentViaColumn() {
  try {
    // Check if sent_via column already exists
    const schema = await query<any[]>(`PRAGMA table_info(notifications)`);
    const hasColumn = schema.some((col: any) => col.name === 'sent_via');
    
    if (hasColumn) {
      console.log('sent_via column already exists in notifications table');
      process.exit(0);
    }

    // Add the column
    await query(`ALTER TABLE notifications ADD COLUMN sent_via TEXT DEFAULT 'push'`);
    console.log('Added sent_via column to notifications table');

    // Verify
    const updatedSchema = await query<any[]>(`PRAGMA table_info(notifications)`);
    console.log('\nUpdated notifications table schema:');
    console.table(updatedSchema);

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addSentViaColumn();
