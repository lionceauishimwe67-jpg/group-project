import { query } from '../config/database';

const checkDatabaseImages = async () => {
  console.log('Checking database image storage...\n');

  const announcements = await query<any[]>('SELECT id, title, image_path, image_mime_type, LENGTH(image_data) as data_size FROM announcements');

  console.log(`Found ${announcements.length} announcements\n`);

  announcements.forEach(ann => {
    console.log(`ID: ${ann.id}`);
    console.log(`  Title: ${ann.title}`);
    console.log(`  Image Path: ${ann.image_path}`);
    console.log(`  MIME Type: ${ann.image_mime_type}`);
    console.log(`  Data Size: ${ann.data_size ? `${ann.data_size} bytes` : 'NULL'}`);
    console.log(`  Has Image Data: ${ann.data_size ? 'YES' : 'NO'}`);
    console.log('');
  });
};

checkDatabaseImages().catch(console.error);
