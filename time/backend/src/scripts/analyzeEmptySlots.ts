import { query } from '../config/database';

async function analyzeEmptySlots() {
  try {
    // Get all timetable entries
    const entries = await query<any[]>(`
      SELECT 
        t.day_of_week,
        substr(t.start_time, 1, 5) AS start_time,
        substr(t.end_time, 1, 5) AS end_time,
        c.name AS class_name
      FROM timetable t
      JOIN classes c ON t.class_id = c.id
      WHERE t.is_active = 1
      ORDER BY t.day_of_week, t.start_time, c.name
    `);

    // Define all expected time slots from Excel
    const allTimeSlots = [
      '08:10', '08:50', '09:30', '10:10', '10:25', '11:05', '11:45', '12:25', '13:30', '14:10', '14:50', '15:30', '15:40', '16:20', '17:00'
    ];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const classes = [...new Set(entries.map(e => e.class_name))];

    console.log('=== EMPTY TIME SLOTS ANALYSIS ===\n');
    console.log(`Total time slots per day: ${allTimeSlots.length}`);
    console.log(`Total classes: ${classes.length}`);
    console.log(`Expected total slots: ${allTimeSlots.length * classes.length * 5} (Mon-Fri)`);
    console.log(`Actual entries: ${entries.length}\n`);

    // Check each day for empty slots
    for (let day = 1; day <= 5; day++) {
      console.log(`\n--- ${dayNames[day]} ---`);
      
      const dayEntries = entries.filter(e => e.day_of_week === day);
      const usedSlots = [...new Set(dayEntries.map(e => e.start_time))];
      
      console.log(`Used time slots: ${usedSlots.length}/${allTimeSlots.length}`);
      
      const emptySlots = allTimeSlots.filter(slot => !usedSlots.includes(slot));
      
      if (emptySlots.length > 0) {
        console.log(`Empty time slots: ${emptySlots.join(', ')}`);
      } else {
        console.log('All time slots are filled');
      }

      // Check each class
      console.log('\nClass coverage:');
      classes.forEach(className => {
        const classEntries = dayEntries.filter(e => e.class_name === className);
        const classSlots = [...new Set(classEntries.map(e => e.start_time))];
        const classEmpty = allTimeSlots.filter(slot => !classSlots.includes(slot));
        
        console.log(`  ${className}: ${classSlots.length}/${allTimeSlots.length} slots filled`);
        if (classEmpty.length > 0) {
          console.log(`    Empty: ${classEmpty.join(', ')}`);
        }
      });
    }

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

analyzeEmptySlots();
