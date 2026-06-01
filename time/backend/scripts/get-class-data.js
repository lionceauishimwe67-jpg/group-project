const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({ filename: 'database.sqlite', driver: sqlite3.Database });
  
  // Get all L3, L4, L5 classes
  const classes = await db.all(`SELECT id, name, level FROM classes WHERE name LIKE 'L3%' OR name LIKE 'L4%' OR name LIKE 'L5%' ORDER BY name`);
  console.log('=== L3/L4/L5 Classes ===');
  console.log(JSON.stringify(classes, null, 2));
  
  // Get all teachers
  const teachers = await db.all(`SELECT id, name, phone FROM teachers ORDER BY name`);
  console.log('\n=== Teachers (' + teachers.length + ') ===');
  teachers.forEach(t => console.log(`  ${t.id}: ${t.name}`));
  
  // Get all subjects
  const subjects = await db.all(`SELECT id, name, code FROM subjects ORDER BY name`);
  console.log('\n=== Subjects (' + subjects.length + ') ===');
  subjects.forEach(s => console.log(`  ${s.id}: ${s.name}`));
  
  // Get teacher-subject mappings
  const mappings = await db.all(`
    SELECT ts.teacher_id, t.name as teacher_name, ts.subject_id, s.name as subject_name
    FROM teacher_subjects ts
    JOIN teachers t ON ts.teacher_id = t.id
    JOIN subjects s ON ts.subject_id = s.id
    ORDER BY t.name, s.name
  `);
  console.log('\n=== Teacher-Subject Mappings (' + mappings.length + ') ===');
  mappings.forEach(m => console.log(`  ${m.teacher_name} -> ${m.subject_name}`));
  
  // Get existing timetable entries for L3/L4/L5 classes
  const entries = await db.all(`
    SELECT c.name as class_name, s.name as subject_name, t.name as teacher_name,
           t2.day_of_week, t2.start_time, t2.end_time
    FROM timetable t2
    JOIN classes c ON t2.class_id = c.id
    JOIN subjects s ON t2.subject_id = s.id
    LEFT JOIN teachers t ON t2.teacher_id = t.id
    WHERE c.name LIKE 'L3%' OR c.name LIKE 'L4%' OR c.name LIKE 'L5%'
    ORDER BY c.name, t2.day_of_week, t2.start_time
  `);
  console.log('\n=== Existing Timetable Entries for L3/L4/L5 (' + entries.length + ') ===');
  entries.forEach(e => console.log(`  ${e.class_name}: ${e.subject_name} (${e.teacher_name}) - Day ${e.day_of_week} ${e.start_time}-${e.end_time}`));
  
  await db.close();
})();
