import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './database.sqlite';

const addImagesToAnnouncements = async () => {
  try {
    const dbPath = path.resolve(DB_PATH);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Adding images to announcements without images...\n');
    
    // Sample images from Unsplash
    const sampleImages = [
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop', // School/education
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop', // Books/study
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&h=400&fit=crop', // Library
    ];
    
    // Get announcements without images
    const announcements = await db.all('SELECT id, title FROM announcements WHERE image_path IS NULL OR image_path = ""');
    
    if (announcements.length === 0) {
      console.log('All announcements already have images.');
    } else {
      console.log(`Found ${announcements.length} announcements without images:\n`);
      
      for (let i = 0; i < announcements.length; i++) {
        const announcement: any = announcements[i];
        const imageUrl = sampleImages[i % sampleImages.length];
        
        await db.run(
          `UPDATE announcements SET image_path = ? WHERE id = ?`,
          [imageUrl, announcement.id]
        );
        
        console.log(`Updated announcement ID ${announcement.id}: "${announcement.title}" with image`);
      }
    }
    
    console.log('\nAll announcements now have images!');
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to add images to announcements:', error);
    process.exit(1);
  }
};

addImagesToAnnouncements();
