const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({ filename: 'database.sqlite', driver: sqlite3.Database });

  // Clear old wrong mappings first
  await db.run('DELETE FROM teacher_subjects');

  // Find exact subject IDs
  const findSubject = async (name) => {
    const rows = await db.all('SELECT id, name, code FROM subjects WHERE LOWER(name) = LOWER(?) OR LOWER(code) = LOWER(?)', [name, name]);
    if (rows.length > 0) return rows[0];
    // Try partial match
    const partial = await db.all('SELECT id, name, code FROM subjects WHERE LOWER(name) LIKE LOWER(?)', [`%${name}%`]);
    return partial.length > 0 ? partial[0] : null;
  };

  const findTeacher = async (namePart) => {
    const rows = await db.all('SELECT id, name FROM teachers WHERE LOWER(name) LIKE LOWER(?)', [`%${namePart}%`]);
    return rows.length > 0 ? rows[0] : null;
  };

  const mappings = [
    // Mathematics
    { teacher: 'KARENZI', subject: 'Mathematics' },
    { teacher: 'MUVARA', subject: 'Mathematics' },
    { teacher: 'NSHIMIYIMANA', subject: 'Mathematics' },
    // Physics
    { teacher: 'IGIHOZO', subject: 'Physics' },
    { teacher: 'HAGENIMANA', subject: 'Physics' },
    // Chemistry
    { teacher: 'NYIRAKANYAMNA', subject: 'Chemistry' },
    { teacher: 'UWUMUKIZA', subject: 'Chemistry' },
    // Biology
    { teacher: 'NYIRANSABIMANA', subject: 'Biology' },
    { teacher: 'MUKAMUGEMA', subject: 'Biology' },
    // History - check if it exists
    { teacher: 'NDABAKURANYE', subject: 'History' },
    { teacher: 'MUSIGI', subject: 'History' },
    // English
    { teacher: 'Alice', subject: 'English' },
    { teacher: 'UWERA', subject: 'English' },
    { teacher: 'MINANI', subject: 'English' },
    // French
    { teacher: 'Claudine', subject: 'French' },
    { teacher: 'KAGABO', subject: 'French' },
    // Swahili
    { teacher: 'NSABIMANA', subject: 'Swahili' },
    // Kinyarwanda
    { teacher: 'NIYONZOMA', subject: 'KINYA' },
    { teacher: 'MUTESI', subject: 'KINYA' },
    { teacher: 'NIRINGIYIMANA', subject: 'KINYA' },
    // ICT
    { teacher: 'Eric', subject: 'ICT' },
    { teacher: 'HARERIMANA', subject: 'ICT' },
    // Python
    { teacher: 'NTIBIBUKA', subject: 'PYTHON' },
    // Network Administration
    { teacher: 'IRARORA', subject: 'Network Administration' },
    { teacher: 'KWIZERA', subject: 'Network Administration' },
    // Software Development
    { teacher: 'MUGIRANEZA', subject: 'Software Development' },
    { teacher: 'USANASE', subject: 'Software Development' },
    // Web Development
    { teacher: 'NKUNDABANYANGA', subject: 'Web Development' },
    { teacher: 'NIYODUSENGA', subject: 'Web Development' },
    // Accounting
    { teacher: 'Jean Mugisha', subject: 'Accounting' },
    { teacher: 'NZAMBAZAMARIYA', subject: 'Accounting' },
    // Taxation
    { teacher: 'UWIKUNDA', subject: 'TAXATION' },
    // Religion
    { teacher: 'Padri HABIMANA', subject: 'RELIGION' },
    { teacher: 'Padri NSENGIYUMVA', subject: 'RELIGION' },
    // Physical Ed
    { teacher: 'BAKUNDUKIZE', subject: 'PHYSICAL ED' },
    // Sport
    { teacher: 'MUSAFIRI', subject: 'SPORT' },
    // Entrepreneurship
    { teacher: 'Pascal Habimana', subject: 'Entrepreneurship' },
  ];

  let inserted = 0;
  let failed = 0;

  for (const m of mappings) {
    const teacher = await findTeacher(m.teacher);
    const subject = await findSubject(m.subject);

    if (teacher && subject) {
      await db.run('INSERT OR IGNORE INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)', [teacher.id, subject.id]);
      console.log(`  OK: ${teacher.name} -> ${subject.name} (id=${subject.id})`);
      inserted++;
    } else {
      console.log(`  FAIL: teacher=${m.teacher}(${teacher ? teacher.id : 'NOT FOUND'}), subject=${m.subject}(${subject ? subject.id : 'NOT FOUND'})`);
      failed++;
    }
  }

  console.log(`\nInserted: ${inserted}, Failed: ${failed}`);

  // Show all mappings
  const result = await db.all('SELECT ts.teacher_id, ts.subject_id, t.name as teacher, s.name as subject, s.code FROM teacher_subjects ts JOIN teachers t ON ts.teacher_id = t.id JOIN subjects s ON ts.subject_id = s.id ORDER BY s.name, t.name');
  console.log(`\nTotal: ${result.length} mappings`);
  result.forEach(r => console.log(`  ${r.teacher} -> ${r.subject} (${r.code || 'no code'})`));

  await db.close();
})();
