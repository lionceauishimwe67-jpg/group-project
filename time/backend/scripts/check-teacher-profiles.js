const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({ filename: 'database.sqlite', driver: sqlite3.Database });
  
  // Check what tables exist related to teachers
  const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%teacher%'");
  console.log('Teacher-related tables:', tables.map(t => t.name));
  
  // Check teachers table structure
  const teacherColumns = await db.all('PRAGMA table_info(teachers)');
  console.log('\nTeachers table columns:');
  teacherColumns.forEach(c => console.log('  ' + c.name + ' (' + c.type + ')'));
  
  // Check if there's a teacher_profiles or similar table
  const allTables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('\nAll tables:', allTables.map(t => t.name));
  
  // Get all teachers with their profile info
  const teachers = await db.all('SELECT * FROM teachers ORDER BY name');
  console.log('\n=== TEACHERS IN DATABASE ===');
  teachers.forEach(t => {
    console.log('\n👤 ' + t.name + ' (ID: ' + t.id + ')');
    console.log('   Email: ' + (t.email || 'none'));
    console.log('   Phone: ' + (t.phone || 'none'));
  });
  
  // Get current teacher-subject mappings
  const mappings = await db.all(`
    SELECT ts.teacher_id, t.name as teacher_name, ts.subject_id, s.name as subject_name, s.code as subject_code
    FROM teacher_subjects ts
    JOIN teachers t ON ts.teacher_id = t.id
    JOIN subjects s ON ts.subject_id = s.id
    ORDER BY t.name, s.name
  `);
  
  console.log('\n=== CURRENT TEACHER-SUBJECT MAPPINGS (Total: ' + mappings.length + ') ===');
  
  let currentTeacher = '';
  for (const m of mappings) {
    if (m.teacher_name !== currentTeacher) {
      currentTeacher = m.teacher_name;
      console.log('\n👤 ' + currentTeacher + ' (ID: ' + m.teacher_id + '):');
    }
    console.log('   - ' + m.subject_name + ' (' + (m.subject_code || 'no code') + ')');
  }
  
  await db.close();
})();
