import fs from 'fs';
import path from 'path';

async function cleanupUploads() {
  try {
    const uploadDir = path.join(process.cwd(), 'uploads', 'announcements');
    
    if (!fs.existsSync(uploadDir)) {
      console.log('Uploads directory does not exist');
      process.exit(0);
    }

    const files = fs.readdirSync(uploadDir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif', '.avif', '.heic', '.heif'];
    
    console.log('Files in uploads/announcements:', files);
    console.log('\nCleaning up non-image files...');
    
    let deletedCount = 0;
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!imageExtensions.includes(ext) && file !== '.gitkeep') {
        const filePath = path.join(uploadDir, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`  Deleted: ${file}`);
          deletedCount++;
        } catch (err) {
          console.error(`  Failed to delete ${file}:`, err);
        }
      }
    }

    console.log(`\nDeleted ${deletedCount} non-image files`);
    
    const remainingFiles = fs.readdirSync(uploadDir);
    console.log('Remaining files:', remainingFiles);
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

cleanupUploads();
