const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({ filename: 'database.sqlite', driver: sqlite3.Database });
  
  // Classes to keep (L3, L4, L5 for the 4 specializations + S1A)
  const keepClasses = ['L3FAD', 'L3NIT', 'L3SWD', 'L3CSA', 'L4FAD', 'L4NIT', 'L4SWD', 'L4CSA', 'L5FAD', 'L5NIT', 'L5SWD', 'L5CSA', 'S1A'];
  
  // Get current classes
  const currentClasses = await db.all('SELECT id, name FROM classes');
  
  // Delete classes that shouldn't be there
  for (const cls of currentClasses) {
    if (!keepClasses.includes(cls.name)) {
      console.log('Deleting class:', cls.name, '(ID:', cls.id + ')');
      await db.run('DELETE FROM classes WHERE id = ?', [cls.id]);
    }
  }
  
  // Add missing classes
  const classesToAdd = [
    { name: 'L3CSA', level: 'L3' },
    { name: 'L4CSA', level: 'L4' },
  ];
  
  for (const cls of classesToAdd) {
    const existing = await db.get('SELECT id FROM classes WHERE name = ?', [cls.name]);
    if (!existing) {
      const result = await db.run('INSERT INTO classes (name, level) VALUES (?, ?)', [cls.name, cls.level]);
      console.log('Added class:', cls.name, '(ID:', result.lastID + ')');
    } else {
      console.log('Class already exists:', cls.name);
    }
  }
  
  // Verify final list
  const finalClasses = await db.all('SELECT id, name, level FROM classes ORDER BY name');
  console.log('\nFinal classes:');
  finalClasses.forEach(c => console.log('  ' + c.id + ': ' + c.name + ' (' + c.level + ')'));
  
  await db.close();
  console.log('\nDone!');
})();
