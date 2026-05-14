import { initDatabase } from '../config/database';
import fs from 'fs';
import path from 'path';

const runMigration = async () => {
  try {
    const db = await initDatabase();
    
    const sqlPath = path.join(__dirname, '../migrations/breakTimeSchema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.exec(statement);
      }
    }
    
    console.log('Break time schema migration completed successfully');
    await db.close();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
