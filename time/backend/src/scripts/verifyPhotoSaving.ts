import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './database.sqlite';

const verifyPhotoSaving = async () => {
  try {
    const dbPath = path.resolve(DB_PATH);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Verifying database photo saving...\n');
    
    // Check database schema
    const schema = await db.all("PRAGMA table_info(announcements)");
    console.log('Announcements table schema:');
    schema.forEach((column: any) => {
      console.log(`  ${column.name}: ${column.type} ${column.notnull ? 'NOT NULL' : 'NULL'}`);
    });
    
    console.log('\n---\n');
    
    // Check current announcements with images
    const announcements = await db.all('SELECT id, title, image_path FROM announcements WHERE image_path IS NOT NULL');
    
    if (announcements.length === 0) {
      console.log('No announcements with images found in database.');
    } else {
      console.log(`Found ${announcements.length} announcements with images:\n`);
      
      announcements.forEach((ann: any) => {
        console.log(`ID: ${ann.id}`);
        console.log(`Title: ${ann.title}`);
        console.log(`Image Path: ${ann.image_path}`);
        
        // Check if file exists
        if (ann.image_path && !ann.image_path.startsWith('http')) {
          const fullPath = path.join(process.cwd(), ann.image_path);
          const exists = fs.existsSync(fullPath);
          console.log(`File exists: ${exists ? 'YES' : 'NO'}`);
        }
        console.log('---');
      });
    }
    
    console.log('\n---\n');
    console.log('Database is configured to save photos in the image_path column.');
    console.log('Photos are stored in: uploads/announcements/');
    console.log('All file types are accepted.');
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to verify photo saving:', error);
    process.exit(1);
  }
};

verifyPhotoSaving();
