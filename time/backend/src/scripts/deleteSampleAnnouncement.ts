import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './database.sqlite';

const deleteSampleAnnouncement = async () => {
  try {
    const dbPath = path.resolve(DB_PATH);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Deleting sample announcement...\n');
    
    // Delete the sample announcement
    const result = await db.run(`
      DELETE FROM announcements WHERE title = 'Welcome to Our School'
    `);
    
    if (result.changes && result.changes > 0) {
      console.log('Sample announcement deleted successfully!');
    } else {
      console.log('No sample announcement found to delete.');
    }
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to delete sample announcement:', error);
    process.exit(1);
  }
};

deleteSampleAnnouncement();
