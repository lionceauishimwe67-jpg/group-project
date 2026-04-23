import { query } from '../config/database';

async function createMissingClasses() {
  try {
    // Required class names
    const requiredClasses = [
      'L3SWD', 'L4SWD', 'L5SWD',
      'L3CSA', 'L4CSA', 'L5CSA',
      'L3NIT', 'L4NIT', 'L5NIT',
      'L3FAD', 'L4FAD', 'L5FAD',
      'S4ACC', 'S5ACC', 'S6ACC'
    ];

    // Get current classes
    const currentClasses = await query<{ id: number; name: string }[]>('SELECT id, name FROM classes ORDER BY name');
    const currentClassNames = currentClasses.map(c => c.name);

    console.log('Current classes:', currentClassNames);

    // Find missing classes
    const missingClasses = requiredClasses.filter(name => !currentClassNames.includes(name));
    
    console.log('\nMissing classes to create:', missingClasses);

    if (missingClasses.length === 0) {
      console.log('All required classes already exist.');
      process.exit(0);
    }

    // Create missing classes
    for (const className of missingClasses) {
      // Extract level from class name (e.g., L3SWD -> L3, S4ACC -> S4)
      const level = className.substring(0, 2); // First 2 characters (L3, S4, etc.)
      await query('INSERT INTO classes (name, level) VALUES (?, ?)', [className, level]);
      console.log(`Created class: ${className} (Level: ${level})`);
    }

    // Verify all classes
    const allClasses = await query<{ id: number; name: string }[]>('SELECT id, name FROM classes ORDER BY name');
    console.log('\nAll classes after creation:');
    console.table(allClasses);

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createMissingClasses();
