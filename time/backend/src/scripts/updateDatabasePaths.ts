import { query, run } from '../config/database';
import path from 'path';

const updateDatabasePaths = async () => {
  console.log('Updating database paths for moved photos...\n');

  // Get all announcements with image paths
  const announcements = await query<any[]>('SELECT id, image_path FROM announcements WHERE image_path IS NOT NULL');
  
  console.log(`Found ${announcements.length} announcements with images\n`);

  let updatedCount = 0;

  for (const ann of announcements) {
    const oldPath = ann.image_path;
    
    // Only update if the path is in the old format (not already in a subfolder)
    if (!oldPath.includes('/announcements/jpg/') && 
        !oldPath.includes('/announcements/png/') && 
        !oldPath.includes('/announcements/gif/') &&
        !oldPath.includes('/announcements/webp/') &&
        !oldPath.includes('/announcements/svg/') &&
        !oldPath.includes('/announcements/ico/') &&
        !oldPath.includes('/announcements/bmp/') &&
        !oldPath.includes('/announcements/tiff/') &&
        !oldPath.includes('/announcements/avif/') &&
        !oldPath.includes('/announcements/heic/')) {
      
      const fileName = path.basename(oldPath);
      const ext = path.extname(fileName).toLowerCase();
      
      let subfolder: string;
      if (ext === '.jpg' || ext === '.jpeg') {
        subfolder = 'jpg';
      } else if (ext === '.png') {
        subfolder = 'png';
      } else if (ext === '.gif') {
        subfolder = 'gif';
      } else if (ext === '.webp') {
        subfolder = 'webp';
      } else if (ext === '.svg') {
        subfolder = 'svg';
      } else if (ext === '.ico') {
        subfolder = 'ico';
      } else if (ext === '.bmp') {
        subfolder = 'bmp';
      } else if (ext === '.tiff' || ext === '.tif') {
        subfolder = 'tiff';
      } else if (ext === '.avif') {
        subfolder = 'avif';
      } else if (ext === '.heic' || ext === '.heif') {
        subfolder = 'heic';
      } else {
        console.log(`Skipping ${fileName} - unsupported extension: ${ext}`);
        continue;
      }

      const newPath = `/uploads/announcements/${subfolder}/${fileName}`;
      
      await run(
        `UPDATE announcements SET image_path = ? WHERE id = ?`,
        [newPath, ann.id]
      );
      
      console.log(`Updated ID ${ann.id}: ${oldPath} -> ${newPath}`);
      updatedCount++;
    }
  }

  console.log(`\n✓ Updated ${updatedCount} database paths`);
};

updateDatabasePaths().catch(console.error);
