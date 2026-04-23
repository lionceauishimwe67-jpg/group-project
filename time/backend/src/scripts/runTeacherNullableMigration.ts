import fs from 'fs';
import path from 'path';
import { query } from '../config/database';

async function runMigration() {
  const migrationPath = path.join(__dirname, '../migrations/make_teacher_nullable.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Running migration: make_teacher_nullable.sql');

  try {
    await query(sql);
    console.log('Migration completed successfully');
  } catch (error: any) {
    console.error('Migration failed:', error.message);
    throw error;
  }

  process.exit(0);
}

runMigration().catch(err => {
  console.error(err);
  process.exit(1);
});
