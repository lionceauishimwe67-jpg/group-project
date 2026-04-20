import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './database.sqlite';

const fixAnnouncementImages = async () => {
  try {
    const dbPath = path.resolve(DB_PATH);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Fixing announcement images...\n');
    
    // Fix ID 8 with null image
    await db.run(
      `UPDATE announcements SET image_path = ? WHERE id = ?`,
      ['https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop', 8]
    );
    console.log('✓ Fixed ID 8 with default image');
    
    // Fix filenames with spaces - rename files and update database
    const uploadDir = path.join(process.cwd(), 'uploads', 'announcements');
    const announcements = await db.all('SELECT id, image_path FROM announcements WHERE image_path LIKE "uploads/announcements/%"');
    
    console.log('\nChecking for files with spaces in names...\n');
    
    for (const ann of announcements) {
      if (ann.image_path && ann.image_path.includes(' ')) {
        const oldFileName = path.basename(ann.image_path);
        const oldPath = path.join(uploadDir, oldFileName);
        
        // Create new filename without spaces
        const newFileName = oldFileName.replace(/\s+/g, '_').replace(/-/g, '_');
        const newPath = path.join(uploadDir, newFileName);
        const newImagePath = `uploads/announcements/${newFileName}`;
        
        // Rename file
        const fs = require('fs');
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          
          // Update database
          await db.run(
            `UPDATE announcements SET image_path = ? WHERE id = ?`,
            [newImagePath, ann.id]
          );
          
          console.log(`✓ Renamed: ${oldFileName} -> ${newFileName}`);
        }
      }
    }
    
    console.log('\nAll issues fixed!');
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to fix announcement images:', error);
    process.exit(1);
  }
};

fixAnnouncementImages();
