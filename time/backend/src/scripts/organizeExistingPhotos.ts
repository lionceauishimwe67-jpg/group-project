import fs from 'fs';
import path from 'path';
import { query, run } from '../config/database';

const announcementsDir = path.join(process.cwd(), 'uploads', 'announcements');

// Get all files in the announcements directory
const files = fs.readdirSync(announcementsDir).filter(file => {
  const filePath = path.join(announcementsDir, file);
  return fs.statSync(filePath).isFile() && file !== '.gitkeep';
});

console.log(`Found ${files.length} files to organize`);

// Move files to appropriate subfolders
files.forEach(file => {
  const ext = path.extname(file).toLowerCase();
  const sourcePath = path.join(announcementsDir, file);
  
  let targetFolder: string;
  
  if (ext === '.jpg' || ext === '.jpeg') {
    targetFolder = path.join(announcementsDir, 'jpg');
  } else if (ext === '.png') {
    targetFolder = path.join(announcementsDir, 'png');
  } else if (ext === '.gif') {
    targetFolder = path.join(announcementsDir, 'gif');
  } else if (ext === '.webp') {
    targetFolder = path.join(announcementsDir, 'webp');
  } else if (ext === '.svg') {
    targetFolder = path.join(announcementsDir, 'svg');
  } else if (ext === '.ico') {
    targetFolder = path.join(announcementsDir, 'ico');
  } else if (ext === '.bmp') {
    targetFolder = path.join(announcementsDir, 'bmp');
  } else if (ext === '.tiff' || ext === '.tif') {
    targetFolder = path.join(announcementsDir, 'tiff');
  } else if (ext === '.avif') {
    targetFolder = path.join(announcementsDir, 'avif');
  } else if (ext === '.heic' || ext === '.heif') {
    targetFolder = path.join(announcementsDir, 'heic');
  } else {
    console.log(`Skipping ${file} - unsupported extension: ${ext}`);
    return;
  }
  
  const targetPath = path.join(targetFolder, file);
  
  // Move file
  fs.renameSync(sourcePath, targetPath);
  console.log(`Moved ${file} to ${path.basename(targetFolder)}/`);
  
  // Update database path
  const oldPath = `/uploads/announcements/${file}`;
  const newPath = `/uploads/announcements/${path.basename(targetFolder)}/${file}`;
  
  run(
    `UPDATE announcements SET image_path = ? WHERE image_path = ?`,
    [newPath, oldPath]
  ).then(() => {
    console.log(`Updated database: ${oldPath} -> ${newPath}`);
  }).catch(err => {
    console.error(`Failed to update database for ${file}:`, err);
  });
});

console.log('Photo organization complete');
