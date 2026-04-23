import { query } from '../config/database';

/**
 * Script to delete all teachers from the database
 */

const deleteAllTeachers = async () => {
  try {
    console.log('Deleting all teachers...');
    
    // First, check how many teachers exist
    const teachers = await query<any[]>('SELECT COUNT(*) as count FROM teachers');
    const count = teachers[0].count;
    console.log(`Found ${count} teachers in database`);
    
    if (count === 0) {
      console.log('No teachers to delete');
      process.exit(0);
    }
    
    // Delete all timetable entries first (due to foreign key constraints)
    await query('DELETE FROM timetable');
    console.log('Deleted all timetable entries');
    
    // Delete all teachers
    await query('DELETE FROM teachers');
    console.log('Deleted all teachers');
    
    console.log('Successfully deleted all teachers and associated timetable entries');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting teachers:', error);
    process.exit(1);
  }
};

deleteAllTeachers();
