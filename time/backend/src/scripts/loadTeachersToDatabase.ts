import * as fs from 'fs';
import * as path from 'path';
import { initDatabase } from '../config/database';

interface TeacherProfile {
  name: string;
  phone?: string;
  email?: string;
  subjects?: string[];
}

async function loadTeachersToDatabase() {
  const teachersJsonPath = path.join(__dirname, '../../../extracted-teachers.json');
  
  // Read extracted teachers
  const teachersJson = fs.readFileSync(teachersJsonPath, 'utf8');
  const teachers: TeacherProfile[] = JSON.parse(teachersJson);
  
  console.log(`Found ${teachers.length} teachers to load`);
  
  // Initialize database (this will create tables if they don't exist)
  const db = await initDatabase();
  
  let loaded = 0;
  let skipped = 0;
  
  for (const teacher of teachers) {
    // Check if teacher already exists
    const existing = await db.get('SELECT id FROM teachers WHERE name = ?', [teacher.name]);
    
    if (existing) {
      console.log(`Skipped: ${teacher.name} (already exists)`);
      skipped++;
    } else {
      // Insert teacher
      await db.run(
        'INSERT INTO teachers (name, phone, email) VALUES (?, ?, ?)',
        [teacher.name, teacher.phone || null, teacher.email || null]
      );
      console.log(`Loaded: ${teacher.name} ${teacher.phone ? `(${teacher.phone})` : ''}`);
      loaded++;
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Loaded: ${loaded} teachers`);
  console.log(`Skipped: ${skipped} teachers (already exist)`);
  console.log(`Total: ${teachers.length} teachers`);
}

loadTeachersToDatabase().catch(console.error);
