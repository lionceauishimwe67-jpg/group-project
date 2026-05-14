import { query } from '../config/database';

async function runMigration() {
  try {
    console.log('Adding level column to teachers table...');
    await query('ALTER TABLE teachers ADD COLUMN level TEXT');
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error: any) {
    if (error.message.includes('duplicate column')) {
      console.log('Level column already exists. Skipping migration.');
      process.exit(0);
    }
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
