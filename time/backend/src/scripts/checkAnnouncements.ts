import { query } from '../config/database';

async function checkAnnouncements() {
  try {
    // Check table schema
    const schema = await query<any[]>(`PRAGMA table_info(announcements)`);
    console.log('Announcements table schema:');
    console.table(schema);

    // Check current announcements
    const announcements = await query<any[]>(`SELECT * FROM announcements`);
    console.log('\nCurrent announcements in database:');
    console.table(announcements);

    // Check uploads directory
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(process.cwd(), 'uploads', 'announcements');
    
    console.log('\nUploads directory:', uploadDir);
    console.log('Directory exists:', fs.existsSync(uploadDir));
    
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      console.log('Files in uploads/announcements:', files);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAnnouncements();
