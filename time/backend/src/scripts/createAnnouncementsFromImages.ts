import { query, run } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

async function createAnnouncementsFromImages() {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads/announcements/jpg');
    
    console.log('Scanning uploads directory:', uploadsDir);
    
    const files = fs.readdirSync(uploadsDir).filter(file => 
      file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
    );
    
    console.log(`Found ${files.length} image files`);
    
    // Get existing announcements to avoid duplicates
    const existingAnnouncements = await query<any[]>('SELECT image_path FROM announcements WHERE image_path IS NOT NULL');
    const existingPaths = new Set(existingAnnouncements.map(a => a.image_path));
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const file of files) {
      const imagePath = `/uploads/announcements/jpg/${file}`;
      
      if (existingPaths.has(imagePath)) {
        console.log(`Skipping ${file} - already exists`);
        skippedCount++;
        continue;
      }
      
      // Read image file
      const filePath = path.join(uploadsDir, file);
      const imageBuffer = fs.readFileSync(filePath);
      
      // Get max display_order
      const maxOrder = await query<{ max_order: number }[]>(
        'SELECT MAX(display_order) as max_order FROM announcements'
      );
      const nextOrder = (maxOrder[0]?.max_order || 0) + 1;
      
      // Create announcement
      await query(
        `INSERT INTO announcements (title, image_path, image_data, image_mime_type, display_order, is_active, expires_at) 
         VALUES (?, ?, ?, ?, ?, 1, datetime('now', '+30 days'))`,
        [file, imagePath, imageBuffer, 'image/jpeg', nextOrder]
      );
      
      console.log(`Created announcement for ${file}`);
      createdCount++;
    }
    
    console.log(`\nSummary: ${createdCount} announcements created, ${skippedCount} skipped`);
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAnnouncementsFromImages();
