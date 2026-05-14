import * as fs from 'fs';
import * as path from 'path';
import { initDatabase } from '../config/database';

async function runMigration() {
  const db = await initDatabase();
  
  console.log('Running migration: Add teacher competences columns...');
  
  try {
    // Check if columns already exist
    const tableInfo = await db.all("PRAGMA table_info(teachers)");
    const columnNames = tableInfo.map((row: any) => row.name);
    
    if (columnNames.includes('specific_competences')) {
      console.log('Columns already exist, skipping migration');
      return;
    }
    
    // Add columns
    await db.run('ALTER TABLE teachers ADD COLUMN specific_competences TEXT');
    console.log('Added specific_competences column');
    
    await db.run('ALTER TABLE teachers ADD COLUMN general_competences TEXT');
    console.log('Added general_competences column');
    
    await db.run('ALTER TABLE teachers ADD COLUMN complementary_competences TEXT');
    console.log('Added complementary_competences column');
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

runMigration().catch(console.error);
