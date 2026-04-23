import { query } from '../config/database';

async function checkClasses() {
  try {
    const classes = await query<{ id: number; name: string }[]>('SELECT id, name FROM classes ORDER BY name');
    console.log('Current classes in database:');
    console.table(classes);
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkClasses();
