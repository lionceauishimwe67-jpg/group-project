import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './database.sqlite';

const verifyAnnouncementSaving = async () => {
  try {
    const dbPath = path.resolve(DB_PATH);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Verifying announcement database configuration...\n');
    
    // Check if announcements table exists
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='announcements'");
    
    if (tables.length === 0) {
      console.log('ERROR: announcements table does not exist!');
      console.log('Creating announcements table...');
      
      await db.run(`
        CREATE TABLE IF NOT EXISTS announcements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          image_path TEXT,
          display_order INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          expires_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Announcements table created successfully!');
    } else {
      console.log('Announcements table exists.');
      
      // Check table schema
      const schema = await db.all("PRAGMA table_info(announcements)");
      console.log('\nTable schema:');
      schema.forEach((column: any) => {
        console.log(`  ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : 'NULL'} ${column.dflt_value ? `DEFAULT ${column.dflt_value}` : ''}`);
      });
      
      // Check current announcements
      const announcements = await db.all('SELECT * FROM announcements');
      console.log(`\nCurrent announcements: ${announcements.length}`);
      
      if (announcements.length > 0) {
        console.log('\nAnnouncement details:');
        announcements.forEach((ann: any) => {
          console.log(`  ID: ${ann.id}, Title: ${ann.title}, Active: ${ann.is_active}`);
        });
      }
    }
    
    console.log('\nDatabase is configured to save announcements.');
    console.log('All announcements will be saved to the announcements table.');
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to verify announcement saving:', error);
    process.exit(1);
  }
};

verifyAnnouncementSaving();
