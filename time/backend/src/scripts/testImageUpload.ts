import fs from 'fs';
import path from 'path';

const testImageUpload = async () => {
  console.log('Testing image upload functionality...\n');

  // Check if uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads', 'announcements');
  console.log(`Uploads directory: ${uploadsDir}`);
  console.log(`Exists: ${fs.existsSync(uploadsDir)}`);

  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    console.log(`Files in uploads directory: ${files.length}`);
    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${stats.isDirectory() ? 'directory' : `${stats.size} bytes`})`);
    });
  }

  // Check subdirectories
  const subdirs = ['jpg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp', 'tiff', 'avif', 'heic'];
  subdirs.forEach(subdir => {
    const subdirPath = path.join(uploadsDir, subdir);
    if (fs.existsSync(subdirPath)) {
      const files = fs.readdirSync(subdirPath);
      if (files.length > 0) {
        console.log(`\n${subdir}/: ${files.length} files`);
        files.forEach(file => {
          const filePath = path.join(subdirPath, file);
          const stats = fs.statSync(filePath);
          console.log(`  - ${file} (${stats.size} bytes)`);
        });
      }
    }
  });

  console.log('\nNote: New uploads are stored in database, not in file system.');
};

testImageUpload().catch(console.error);
