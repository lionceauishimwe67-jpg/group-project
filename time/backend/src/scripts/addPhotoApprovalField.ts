import { query, run } from '../config/database';

async function addPhotoApprovalField() {
  try {
    console.log('Adding is_approved_for_display field to announcements table...');
    
    // Check if column already exists
    const columns = await query<any[]>(
      "PRAGMA table_info(announcements)"
    );
    
    const hasColumn = columns.some(col => col.name === 'is_approved_for_display');
    
    if (hasColumn) {
      console.log('Column is_approved_for_display already exists');
      process.exit(0);
    }
    
    // Add the column
    await query(
      'ALTER TABLE announcements ADD COLUMN is_approved_for_display INTEGER DEFAULT 1'
    );
    
    console.log('Column added successfully');
    
    // Set all existing photo announcements to approved by default
    await query(
      "UPDATE announcements SET is_approved_for_display = 1 WHERE image_data IS NOT NULL OR image_path IS NOT NULL"
    );
    
    console.log('Existing photo announcements set to approved');
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addPhotoApprovalField();
