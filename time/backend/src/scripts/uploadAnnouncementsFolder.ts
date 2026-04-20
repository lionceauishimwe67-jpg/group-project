import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './database.sqlite';

const uploadAnnouncementsFolder = async () => {
  try {
    const dbPath = path.resolve(DB_PATH);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Uploading photos from announcements folder...\n');
    
    const uploadDir = path.join(process.cwd(), 'uploads', 'announcements');
    
    // Get all image files
    const files = fs.readdirSync(uploadDir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return imageExtensions.includes(ext) && !f.startsWith('announcement_');
    });
    
    console.log(`Found ${imageFiles.length} image files:\n`);
    
    // Get existing image paths from database
    const existingPaths = await db.all('SELECT image_path FROM announcements WHERE image_path IS NOT NULL');
    const existingSet = new Set(existingPaths.map((r: any) => r.image_path));
    
    let displayOrder = 20;
    let uploaded = 0;
    
    for (const file of imageFiles) {
      const imagePath = `uploads/announcements/${file}`;
      
      // Skip if already in database
      if (existingSet.has(imagePath)) {
        console.log(`⊘ Skipping (already exists): ${file}`);
        continue;
      }
      
      // Create announcement title from filename
      const title = file
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ') // Replace multiple spaces
        .trim();
      
      // Insert into database
      await db.run(
        `INSERT INTO announcements (title, image_path, display_order, is_active, expires_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [title, imagePath, displayOrder, 1, null]
      );
      
      console.log(`✓ Uploaded: ${title}`);
      console.log(`  Path: ${imagePath}`);
      console.log('---');
      
      uploaded++;
      displayOrder++;
    }
    
    console.log(`\n✓ Uploaded ${uploaded} new announcements!`);
    console.log(`✓ Skipped ${imageFiles.length - uploaded} existing announcements.`);
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to upload announcements folder:', error);
    process.exit(1);
  }
};

uploadAnnouncementsFolder();
