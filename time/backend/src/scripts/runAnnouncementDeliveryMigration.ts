import { initDatabase } from '../config/database';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  const db = await initDatabase();
  
  try {
    const migrationPath = join(__dirname, '../migrations/announcementDeliveryStatus.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.exec(statement);
      }
    }
    
    console.log('Announcement delivery status migration completed successfully');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
