const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({ filename: 'database.sqlite', driver: sqlite3.Database });

  console.log('=== Cleaning duplicate subjects ===\n');

  // Find all duplicate subject names (case-insensitive)
  const duplicates = await db.all(`
    SELECT LOWER(name) as lname, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
    FROM subjects
    GROUP BY LOWER(name)
    HAVING cnt > 1
    ORDER BY cnt DESC
  `);

  console.log('Found ' + duplicates.length + ' duplicate subject groups\n');

  let merged = 0;
  let deleted = 0;

  for (const dup of duplicates) {
    const ids = dup.ids.split(',').map(Number);
    const keepId = ids[0]; // Keep the first one

    // Find the best one to keep (prefer those with codes or used in teacher_subjects)
    const subjects = await db.all('SELECT id, name, code FROM subjects WHERE id IN (' + ids.join(',') + ')');

    // Prefer subject with a code
    let bestId = keepId;
    const withCode = subjects.find(s => s.code);
    if (withCode) bestId = withCode.id;

    // Or prefer one used in teacher_subjects
    const tsCheck = await db.all('SELECT subject_id, COUNT(*) as cnt FROM teacher_subjects WHERE subject_id IN (' + ids.join(',') + ') GROUP BY subject_id ORDER BY cnt DESC');
    if (tsCheck.length > 0) bestId = tsCheck[0].subject_id;

    const removeIds = ids.filter(id => id !== bestId);

    console.log('Subject: "' + dup.lname + '"');
    console.log('  Keep id=' + bestId);
    console.log('  Remove ids: ' + removeIds.join(', '));

    // Update timetable entries to use the kept ID
    for (const removeId of removeIds) {
      const ttCount = await db.get('SELECT COUNT(*) as c FROM timetable WHERE subject_id = ?', [removeId]);
      if (ttCount.c > 0) {
        await db.run('UPDATE timetable SET subject_id = ? WHERE subject_id = ?', [bestId, removeId]);
        console.log('  Updated ' + ttCount.c + ' timetable entries');
      }

      // Update teacher_subjects
      const tsCount = await db.get('SELECT COUNT(*) as c FROM teacher_subjects WHERE subject_id = ?', [removeId]);
      if (tsCount.c > 0) {
        await db.run('INSERT OR IGNORE INTO teacher_subjects (teacher_id, subject_id) SELECT teacher_id, ? FROM teacher_subjects WHERE subject_id = ?', [bestId, removeId]);
        await db.run('DELETE FROM teacher_subjects WHERE subject_id = ?', [removeId]);
        console.log('  Migrated ' + tsCount.c + ' teacher_subjects entries');
      }

      // Delete the duplicate
      await db.run('DELETE FROM subjects WHERE id = ?', [removeId]);
      deleted++;
    }

    merged++;
    console.log('');
  }

  console.log('=== SUMMARY ===');
  console.log('Merged ' + merged + ' duplicate groups');
  console.log('Deleted ' + deleted + ' duplicate subjects');

  // Verify Chemistry is clean now
  const chemCheck = await db.all("SELECT id, name, code FROM subjects WHERE LOWER(name) LIKE '%chem%'");
  console.log('\nChemistry subjects after cleanup:');
  chemCheck.forEach(s => console.log('  id=' + s.id + ' "' + s.name + '" code=' + (s.code || 'null')));

  // Verify teacher_subjects for Chemistry
  if (chemCheck.length > 0) {
    const ts = await db.all('SELECT ts.*, t.name as teacher_name FROM teacher_subjects ts JOIN teachers t ON ts.teacher_id = t.id WHERE ts.subject_id = ?', [chemCheck[0].id]);
    console.log('Teachers for Chemistry (id=' + chemCheck[0].id + '):');
    ts.forEach(r => console.log('  ' + r.teacher_name));
  }

  // Show final subject count
  const totalSubjects = await db.get('SELECT COUNT(*) as c FROM subjects');
  const totalMappings = await db.get('SELECT COUNT(*) as c FROM teacher_subjects');
  console.log('\nTotal subjects: ' + totalSubjects.c);
  console.log('Total teacher_subjects mappings: ' + totalMappings.c);

  await db.close();
})();
