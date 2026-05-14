import fs from 'fs';
import path from 'path';
import { query, run } from '../config/database';

const migrateImagesToDatabase = async () => {
  console.log('Migrating images from file system to database...\n');

  // Add image_data column if it doesn't exist
  try {
    await run(`ALTER TABLE announcements ADD COLUMN image_data BLOB`);
    console.log('✓ Added image_data column to announcements table');
  } catch (err: any) {
    if (err.message.includes('duplicate column')) {
      console.log('✓ image_data column already exists');
    } else {
      console.error('Error adding column:', err);
      return;
    }
  }

  // Add image_mime_type column if it doesn't exist
  try {
    await run(`ALTER TABLE announcements ADD COLUMN image_mime_type TEXT`);
    console.log('✓ Added image_mime_type column to announcements table');
  } catch (err: any) {
    if (err.message.includes('duplicate column')) {
      console.log('✓ image_mime_type column already exists');
    } else {
      console.error('Error adding column:', err);
    }
  }

  // Get all announcements with image paths
  const announcements = await query<any[]>('SELECT id, image_path FROM announcements WHERE image_path IS NOT NULL');
  
  console.log(`\nFound ${announcements.length} announcements with images to migrate\n`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const ann of announcements) {
    const imagePath = ann.image_path;
    
    // Convert relative path to absolute
    let absolutePath: string;
    if (imagePath.startsWith('/uploads/')) {
      // Remove leading slash and convert to absolute
      const relativePath = imagePath.substring(1);
      absolutePath = path.join(process.cwd(), relativePath.replace(/\//g, path.sep));
    } else if (imagePath.startsWith('uploads/')) {
      absolutePath = path.join(process.cwd(), imagePath.replace(/\//g, path.sep));
    } else {
      absolutePath = imagePath;
    }

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      console.log(`⚠ Skipping ID ${ann.id}: File not found - ${imagePath}`);
      skippedCount++;
      continue;
    }

    // Check if already migrated (has image_data)
    const existing = await query<any[]>('SELECT image_data FROM announcements WHERE id = ?', [ann.id]);
    if (existing[0] && existing[0].image_data) {
      console.log(`⚠ Skipping ID ${ann.id}: Already has image_data in database`);
      skippedCount++;
      continue;
    }

    try {
      // Read image file
      const imageBuffer = fs.readFileSync(absolutePath);
      
      // Determine MIME type
      const ext = path.extname(imagePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.bmp': 'image/bmp',
        '.tiff': 'image/tiff',
        '.tif': 'image/tiff',
        '.avif': 'image/avif',
        '.heic': 'image/heic',
        '.heif': 'image/heif',
      };
      const mimeType = mimeTypes[ext] || 'application/octet-stream';

      // Update database with image data
      await run(
        `UPDATE announcements SET image_data = ?, image_mime_type = ? WHERE id = ?`,
        [imageBuffer, mimeType, ann.id]
      );

      console.log(`✓ Migrated ID ${ann.id}: ${path.basename(imagePath)} (${(imageBuffer.length / 1024).toFixed(2)} KB)`);
      migratedCount++;
    } catch (err) {
      console.error(`✗ Failed to migrate ID ${ann.id}:`, err);
    }
  }

  console.log(`\n✓ Successfully migrated ${migratedCount} images`);
  console.log(`⚠ Skipped ${skippedCount} images`);
  console.log('\nMigration complete. Images are now stored in the database.');
};

migrateImagesToDatabase().catch(console.error);
