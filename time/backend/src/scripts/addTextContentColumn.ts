import { run } from '../config/database';

const addTextContentColumn = async () => {
  console.log('Adding text_content column to announcements table...\n');

  try {
    await run(`ALTER TABLE announcements ADD COLUMN text_content TEXT`);
    console.log('✓ Added text_content column to announcements table');
  } catch (err: any) {
    if (err.message.includes('duplicate column')) {
      console.log('✓ text_content column already exists');
    } else {
      console.error('Error adding column:', err);
    }
  }
};

addTextContentColumn().catch(console.error);
