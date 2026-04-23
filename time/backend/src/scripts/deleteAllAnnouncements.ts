import { query } from '../config/database';
import fs from 'fs';
import path from 'path';

/**
 * Script to delete all announcements and their images
 */

const deleteAllAnnouncements = async () => {
  try {
    console.log('Deleting all announcements and images...');
    
    // Get all announcements to find their image paths
    const announcements = await query<any[]>('SELECT image_path FROM announcements');
    console.log(`Found ${announcements.length} announcements`);
    
    // Delete image files
    const uploadDir = path.join(process.cwd(), 'uploads', 'announcements');
    
    for (const ann of announcements) {
      if (ann.image_path) {
        const imagePath = ann.image_path.startsWith('uploads/')
          ? path.join(process.cwd(), ann.image_path.replace(/\//g, path.sep))
          : ann.image_path;
        
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
            console.log(`Deleted image: ${ann.image_path}`);
          } catch (err) {
            console.error(`Failed to delete image ${ann.image_path}:`, err);
          }
        }
      }
    }
    
    // Delete all announcement records
    await query('DELETE FROM announcements');
    console.log('Deleted all announcement records from database');
    
    console.log('Successfully deleted all announcements and images');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting announcements:', error);
    process.exit(1);
  }
};

deleteAllAnnouncements();
