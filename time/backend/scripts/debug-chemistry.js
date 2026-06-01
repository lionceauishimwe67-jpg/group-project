const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({ filename: 'database.sqlite', driver: sqlite3.Database });

  // Check Chemistry subject variations
  const chemSubjects = await db.all("SELECT id, name, code FROM subjects WHERE LOWER(name) LIKE '%chem%'");
  console.log('Chemistry subjects in DB:');
  chemSubjects.forEach(s => console.log('  id=' + s.id + ', name="' + s.name + '", code=' + (s.code || 'null')));

  // Check teacher_subjects for Chemistry
  if (chemSubjects.length > 0) {
    const ts = await db.all('SELECT ts.*, t.name as teacher_name FROM teacher_subjects ts JOIN teachers t ON ts.teacher_id = t.id WHERE ts.subject_id = ?', [chemSubjects[0].id]);
    console.log('\nTeacher-Subject mappings for Chemistry (id=' + chemSubjects[0].id + '):');
    ts.forEach(r => console.log('  ' + r.teacher_name));
  }

  // Simulate what AI generator does when matching "Chemistry"
  const testSubjectName = 'Chemistry';
  const normalizeName = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedSubject = normalizeName(testSubjectName);

  console.log('\n--- Simulating AI matching for "' + testSubjectName + '" ---');
  console.log('Normalized: "' + normalizedSubject + '"');

  const allSubjects = await db.all('SELECT id, name, code FROM subjects ORDER BY name');

  // Exact match
  const exact = allSubjects.find(s => s.name.toLowerCase() === testSubjectName.toLowerCase());
  console.log('Exact match:', exact ? exact.name + ' (id=' + exact.id + ')' : 'NONE');

  // Code match
  const byCode = allSubjects.find(s => s.code && s.code.toLowerCase() === testSubjectName.toLowerCase());
  console.log('Code match:', byCode ? byCode.name + ' (id=' + byCode.id + ')' : 'NONE');

  // Contains match
  const contains = allSubjects.find(s => s.name.toLowerCase().includes(testSubjectName.toLowerCase()));
  console.log('Contains match:', contains ? contains.name + ' (id=' + contains.id + ')' : 'NONE');

  // Normalized match
  const normalized = allSubjects.find(s => normalizeName(s.name) === normalizedSubject);
  console.log('Normalized match:', normalized ? normalized.name + ' (id=' + normalized.id + ')' : 'NONE');

  // Fuzzy match
  const fuzzy = allSubjects.find(s => {
    const candidate = normalizeName(s.name);
    return candidate.length > 3 && normalizedSubject.length > 3 &&
      (candidate.includes(normalizedSubject) || normalizedSubject.includes(candidate));
  });
  console.log('Fuzzy match:', fuzzy ? fuzzy.name + ' (id=' + fuzzy.id + ')' : 'NONE');

  // Show all subjects with "chem" anywhere
  console.log('\nAll subjects containing "chem":');
  const chemAll = allSubjects.filter(s => s.name.toLowerCase().includes('chem'));
  chemAll.forEach(s => console.log('  id=' + s.id + ' "' + s.name + '" code=' + (s.code || 'null')));

  await db.close();
})();
