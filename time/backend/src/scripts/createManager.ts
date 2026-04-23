import { query } from '../config/database';
import bcrypt from 'bcryptjs';

(async () => {
  try {
    const passwordHash = await bcrypt.hash('manager123', 10);
    await query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['manager', passwordHash, 'manager']);
    console.log('Manager user created successfully');
    console.log('Username: manager');
    console.log('Password: manager123');
  } catch (e: any) {
    console.error('Error (user may already exist):', e.message);
  }
  process.exit(0);
})();
