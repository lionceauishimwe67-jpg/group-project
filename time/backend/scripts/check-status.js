const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({ filename: 'database.sqlite', driver: sqlite3.Database });

  const gens = await db.all('SELECT id, class_id, name, validation_status, conflicts, generated_timetable, created_at FROM timetable_generations ORDER BY created_at DESC LIMIT 5');
  console.log('Recent generations:');
  for (const g of gens) {
    const entries = g.generated_timetable ? JSON.parse(g.generated_timetable) : [];
    console.log('  Gen #' + g.id + ': ' + g.name);
    console.log('    Status: ' + g.validation_status);
    console.log('    Entries: ' + entries.length);
    console.log('    Conflicts: ' + (g.conflicts || 'none'));
    console.log('    Date: ' + g.created_at);
  }

  const ttCount = await db.get('SELECT COUNT(*) as c FROM timetable WHERE is_active = 1');
  console.log('\nActive timetable entries in DB: ' + ttCount.c);

  const classes = await db.all('SELECT id, name FROM classes ORDER BY name');
  console.log('\nAvailable classes:');
  classes.forEach(c => console.log('  id=' + c.id + ' "' + c.name + '"'));

  await db.close();
})();
