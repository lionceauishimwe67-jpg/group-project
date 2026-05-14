import { query, run } from '../config/database';

async function addSubjectsColumn() {
  try {
    console.log('Adding subjects column to teachers table...');
    
    await query(`
      ALTER TABLE teachers ADD COLUMN subjects TEXT
    `);
    
    console.log('Subjects column added successfully');
    process.exit(0);
  } catch (error: any) {
    if (error.message.includes('duplicate column')) {
      console.log('Column already exists');
      process.exit(0);
    }
    console.error('Error:', error.message);
    process.exit(1);
  }
}

addSubjectsColumn();
