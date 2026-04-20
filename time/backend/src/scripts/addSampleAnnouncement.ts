import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './database.sqlite';

const addSampleAnnouncement = async () => {
  try {
    const dbPath = path.resolve(DB_PATH);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Adding sample announcement with interface photo...');
    
    // Sample announcement with a better photo showing interface
    const sampleAnnouncement = {
      title: 'School Digital Timetable System',
      image_path: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=400&fit=crop',
      display_order: 1,
      is_active: 1,
      expires_at: null
    };
    
    // Insert sample announcement
    await db.run(
      `INSERT INTO announcements (title, image_path, display_order, is_active, expires_at) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        sampleAnnouncement.title,
        sampleAnnouncement.image_path,
        sampleAnnouncement.display_order,
        sampleAnnouncement.is_active,
        sampleAnnouncement.expires_at
      ]
    );
    
    console.log('Sample announcement added successfully!');
    console.log('Title:', sampleAnnouncement.title);
    console.log('Image URL:', sampleAnnouncement.image_path);
    
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to add sample announcement:', error);
    process.exit(1);
  }
};

addSampleAnnouncement();
