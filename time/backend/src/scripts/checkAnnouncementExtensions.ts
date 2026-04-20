import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './database.sqlite';

const checkAnnouncementExtensions = async () => {
  try {
    const dbPath = path.resolve(DB_PATH);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Checking announcement image extensions...\n');
    
    const announcements = await db.all('SELECT id, title, image_path FROM announcements');
    
    if (announcements.length === 0) {
      console.log('No announcements found in database.');
    } else {
      console.log(`Found ${announcements.length} announcements:\n`);
      
      announcements.forEach((ann: any) => {
        const ext = ann.image_path ? path.extname(ann.image_path) : 'None';
        console.log(`ID: ${ann.id}`);
        console.log(`Title: ${ann.title}`);
        console.log(`Image Path: ${ann.image_path}`);
        console.log(`Extension: ${ext}`);
        console.log('---');
      });
    }
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to check announcements:', error);
    process.exit(1);
  }
};

checkAnnouncementExtensions();
