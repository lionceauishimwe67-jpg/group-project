import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './database.sqlite';

const migrateAnnouncements = async () => {
  try {
    const dbPath = path.resolve(DB_PATH);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Starting migration...');
    
    // Check current schema
    const tableInfo = await db.all(`PRAGMA table_info(announcements)`);
    console.log('Current announcements table schema:', tableInfo);
    
    // Check if image_path has NOT NULL constraint
    const imagePathColumn = tableInfo.find(col => col.name === 'image_path');
    
    if (imagePathColumn && imagePathColumn.notnull === 1) {
      console.log('Found NOT NULL constraint on image_path. Migrating...');
      
      // SQLite doesn't support ALTER TABLE to remove NOT NULL directly
      // We need to recreate the table
      
      // Step 1: Create new table with correct schema
      await db.run(`
        CREATE TABLE announcements_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          image_path TEXT,
          display_order INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          expires_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Step 2: Copy data from old table to new table
      await db.run(`
        INSERT INTO announcements_new (id, title, image_path, display_order, is_active, expires_at, created_at)
        SELECT id, title, image_path, display_order, is_active, expires_at, created_at
        FROM announcements
      `);
      
      // Step 3: Drop old table
      await db.run(`DROP TABLE announcements`);
      
      // Step 4: Rename new table to original name
      await db.run(`ALTER TABLE announcements_new RENAME TO announcements`);
      
      console.log('Migration completed successfully!');
    } else {
      console.log('No migration needed. image_path already allows NULL values.');
    }
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateAnnouncements();
