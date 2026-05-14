import { query, run } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

async function uploadLogo1() {
  try {
    console.log('Uploading logo1.jpg as new logo...');
    
    const logoPath = path.join(__dirname, '../../uploads/announcements/logo1.jpg');
    
    if (!fs.existsSync(logoPath)) {
      console.error('logo1.jpg not found at:', logoPath);
      process.exit(1);
    }
    
    // Read the image file
    const imageData = fs.readFileSync(logoPath);
    console.log('Image size:', imageData.length, 'bytes');
    
    // Delete any existing logo announcements
    await query("DELETE FROM announcements WHERE title LIKE '%logo%'");
    console.log('Deleted existing logo announcements');
    
    // Get max display_order
    const maxOrder = await query<{ max_order: number }[]>(
      'SELECT MAX(display_order) as max_order FROM announcements'
    );
    const nextOrder = (maxOrder[0]?.max_order || 0) + 1;
    
    // Create new logo announcement
    await query(
      `INSERT INTO announcements (title, image_path, image_data, image_mime_type, display_order, is_active, is_approved_for_display, expires_at) 
       VALUES (?, ?, ?, ?, ?, 1, 1, datetime('now', '+365 days'))`,
      ['logo', '/uploads/announcements/logo1.jpg', imageData, 'image/jpeg', nextOrder]
    );
    
    console.log('Logo uploaded successfully');
    console.log('Title: logo');
    console.log('Path: /uploads/announcements/logo1.jpg');
    console.log('Approved for display: Yes');
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

uploadLogo1();
