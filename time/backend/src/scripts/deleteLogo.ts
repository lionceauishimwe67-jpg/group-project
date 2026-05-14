import { query, run } from '../config/database';

async function deleteLogo() {
  try {
    console.log('Deleting logo announcement (ID 58)...');
    
    await query('DELETE FROM announcements WHERE id = 58 AND title = "logo.jpg"');
    
    console.log('Logo deleted successfully');
    console.log('You can now upload a new logo through the admin panel');
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

deleteLogo();
