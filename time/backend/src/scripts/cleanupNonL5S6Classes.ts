import { query } from '../config/database';

async function cleanupNonL5S6Classes() {
  try {
    // Allowed class names (L5 and S6 only)
    const allowedClasses = [
      'L5SWD', 'L5CSA', 'L5NIT', 'L5FAD',
      'S6ACC'
    ];

    // Get all current classes
    const classes = await query<{ id: number; name: string }[]>('SELECT id, name FROM classes ORDER BY name');
    
    console.log('Current classes:');
    console.table(classes);

    // Find classes to delete
    const classesToDelete = classes.filter(c => !allowedClasses.includes(c.name));
    
    console.log('\nClasses to delete (not L5 or S6):');
    console.table(classesToDelete);

    if (classesToDelete.length === 0) {
      console.log('No classes to delete. All classes are L5 or S6.');
      process.exit(0);
    }

    // Delete classes
    const idsToDelete = classesToDelete.map(c => c.id);
    console.log(`\nDeleting ${idsToDelete.length} classes with IDs:`, idsToDelete);

    // First, delete timetable entries for these classes
    const placeholders = idsToDelete.map(() => '?').join(',');
    await query(`DELETE FROM timetable WHERE class_id IN (${placeholders})`, idsToDelete);
    console.log('Deleted timetable entries for these classes.');

    // Then delete the classes
    await query(`DELETE FROM classes WHERE id IN (${placeholders})`, idsToDelete);
    console.log('Deleted classes from database.');

    // Verify remaining classes
    const remainingClasses = await query<{ id: number; name: string }[]>('SELECT id, name FROM classes ORDER BY name');
    console.log('\nRemaining classes after cleanup (L5 and S6 only):');
    console.table(remainingClasses);

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

cleanupNonL5S6Classes();
