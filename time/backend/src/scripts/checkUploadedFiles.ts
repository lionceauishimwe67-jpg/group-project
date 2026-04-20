import fs from 'fs';
import path from 'path';

const checkUploadedFiles = () => {
  const uploadDir = path.join(process.cwd(), 'uploads', 'announcements');
  
  console.log('Checking uploaded files...\n');
  
  if (!fs.existsSync(uploadDir)) {
    console.log('Uploads directory does not exist!');
    return;
  }
  
  const files = fs.readdirSync(uploadDir);
  console.log(`Found ${files.length} files in uploads/announcements/:\n`);
  
  files.forEach(file => {
    const filePath = path.join(uploadDir, file);
    const stats = fs.statSync(filePath);
    console.log(`File: ${file}`);
    console.log(`Size: ${stats.size} bytes`);
    console.log('---');
  });
  
  if (files.length === 0) {
    console.log('No files found in uploads directory.');
  }
};

checkUploadedFiles();
