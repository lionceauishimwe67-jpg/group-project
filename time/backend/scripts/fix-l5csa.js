const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({ filename: 'database.sqlite', driver: sqlite3.Database });
  await db.run('UPDATE classes SET level = ? WHERE name = ?', ['L5', 'L5CSA']);
  const c = await db.get('SELECT id, name, level FROM classes WHERE name = ?', ['L5CSA']);
  console.log('Updated L5CSA:', c);
  await db.close();
})();
