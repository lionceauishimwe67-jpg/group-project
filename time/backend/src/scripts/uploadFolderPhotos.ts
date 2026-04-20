import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './database.sqlite';

const uploadFolderPhotos = async () => {
  try {
    const dbPath = path.resolve(DB_PATH);
    const frontendPath = path.resolve(__dirname, '../../../frontend');
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Uploading photos from project folder...\n');
    
    // Find PNG files in the frontend folder
    const files = fs.readdirSync(frontendPath);
    const pngFiles = files.filter(f => f.endsWith('.png'));
    
    console.log(`Found ${pngFiles.length} unique PNG files:\n`);
    
    const uploadDir = path.join(process.cwd(), 'uploads', 'announcements');
    
    // Ensure upload directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    let displayOrder = 10;
    
    for (const file of pngFiles) {
      const sourcePath = path.join(frontendPath, file);
      const destFileName = `announcement_${Date.now()}_${file}`;
      const destPath = path.join(uploadDir, destFileName);
      
      // Copy file to uploads directory
      fs.copyFileSync(sourcePath, destPath);
      
      // Store relative path for database
      const imagePath = `uploads/announcements/${destFileName}`;
      
      // Create announcement title from filename
      const title = file.replace('.png', '').replace(/-/g, ' ').replace(/_/g, ' ');
      
      // Insert into database
      await db.run(
        `INSERT INTO announcements (title, image_path, display_order, is_active, expires_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [title, imagePath, displayOrder, 1, null]
      );
      
      console.log(`✓ Uploaded: ${title}`);
      console.log(`  Source: ${file}`);
      console.log(`  Path: ${imagePath}`);
      console.log('---');
      
      displayOrder++;
    }
    
    console.log('\nAll photos uploaded successfully!');
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to upload photos:', error);
    process.exit(1);
  }
};

uploadFolderPhotos();
