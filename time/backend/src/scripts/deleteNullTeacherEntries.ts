import { query } from '../config/database';

async function deleteNullTeacherEntries() {
  try {
    // First count how many will be deleted
    const countResult = await query<any[]>(`
      SELECT COUNT(*) as count FROM timetable
      WHERE teacher_id IS NULL AND is_active = 1
    `);
    const countToDelete = countResult[0].count;
    console.log('Timetable entries with null teacher_id to delete:', countToDelete);
    
    // Delete the entries
    await query<any[]>(`
      DELETE FROM timetable
      WHERE teacher_id IS NULL AND is_active = 1
    `);
    
    console.log('Deleted timetable entries with null teacher_id:', countToDelete);
    
    // Verify remaining entries
    const remaining = await query<any[]>(`SELECT COUNT(*) as count FROM timetable WHERE is_active = 1`);
    console.log('Remaining active timetable entries:', remaining[0].count);

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

deleteNullTeacherEntries();
