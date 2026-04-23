import { query } from '../config/database';

async function checkClassSchema() {
  try {
    const result = await query<any[]>(`PRAGMA table_info(classes)`);
    console.log('Classes table schema:');
    console.table(result);
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkClassSchema();
