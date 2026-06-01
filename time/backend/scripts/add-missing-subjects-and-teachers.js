const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({ filename: 'database.sqlite', driver: sqlite3.Database });
  
  // 1. Add missing subjects to database
  const missingSubjects = [
    { name: 'SWDIA502', code: 'SWDIA' },
    { name: 'GENFA402', code: 'GENFA' },
    { name: 'CCMCS402', code: 'CCMCS' },
    { name: 'CCMKS402', code: 'CCMKS' },
    { name: 'FADIA401', code: 'FADIA' },
    { name: 'YEAR202', code: 'YEAR' },
    { name: 'Apply Professional and Multicultural ethics at workplace', code: 'GENEP' },
    { name: 'FADIA501', code: 'FADIA' },
    { name: 'Develop game in Vue Design UI/UX Analyse project requirements Conduct Version Control', code: 'SWDVF' },
    { name: 'CCMFT302', code: 'CCMFT' },
    { name: 'CCMHE302', code: 'CCMHE' },
    { name: 'SWDIA302', code: 'SWDIA' },
    { name: 'CSAIA501', code: 'CSAIA' },
  ];
  
  console.log('=== ADDING MISSING SUBJECTS ===\n');
  for (const sub of missingSubjects) {
    const existing = await db.get('SELECT id FROM subjects WHERE code = ? OR name = ?', [sub.code, sub.name]);
    if (!existing) {
      const result = await db.run('INSERT INTO subjects (name, code) VALUES (?, ?)', [sub.name, sub.code]);
      console.log(`✅ Added: ${sub.name} (${sub.code}) - ID: ${result.lastID}`);
    } else {
      console.log(`⏭️  Exists: ${sub.name} (${sub.code}) - ID: ${existing.id}`);
    }
  }
  
  // 2. Get all teachers
  const teachers = await db.all('SELECT id, name FROM teachers ORDER BY name');
  console.log('\n=== TEACHERS IN DATABASE ===');
  teachers.forEach(t => console.log(`  ${t.id}: ${t.name}`));
  
  // 3. Get all subjects (including newly added)
  const subjects = await db.all('SELECT id, name, code FROM subjects ORDER BY name');
  console.log(`\n=== TOTAL SUBJECTS: ${subjects.length} ===`);
  
  // 4. Create teacher-subject mappings based on chronogram data
  // Map subjects to teachers based on subject type
  const teacherAssignments = [
    // Mathematics teachers
    { keyword: 'math', teacher: 'KARENZI Faustin' },
    { keyword: 'Mathematical Analysis', teacher: 'KARENZI Faustin' },
    { keyword: 'Algebra', teacher: 'KARENZI Faustin' },
    { keyword: 'Trigonometry', teacher: 'KARENZI Faustin' },
    { keyword: 'Statistics', teacher: 'KARENZI Faustin' },
    { keyword: 'Probability', teacher: 'KARENZI Faustin' },
    { keyword: 'logarithms', teacher: 'KARENZI Faustin' },
    { keyword: 'exponential', teacher: 'KARENZI Faustin' },
    
    // English teachers
    { keyword: 'English', teacher: 'Alice Uwase' },
    { keyword: 'intermediate English', teacher: 'Alice Uwase' },
    { keyword: 'upper-intermediate English', teacher: 'Alice Uwase' },
    { keyword: 'Pre-intermediate English', teacher: 'Alice Uwase' },
    
    // French teachers
    { keyword: 'français', teacher: 'Claudine Mukamana' },
    { keyword: 'French', teacher: 'Claudine Mukamana' },
    { keyword: 'idées en Français', teacher: 'Claudine Mukamana' },
    { keyword: 'opinions en français', teacher: 'Claudine Mukamana' },
    
    // Physics teachers
    { keyword: 'physics', teacher: 'HAGENIMANA Fidele' },
    { keyword: 'Dynamics', teacher: 'HAGENIMANA Fidele' },
    { keyword: 'Waves', teacher: 'HAGENIMANA Fidele' },
    
    // Kinyarwanda teachers
    { keyword: 'ikinyarwanda', teacher: 'MUTESI Liliane' },
    { keyword: 'Kinyarwanda', teacher: 'MUTESI Liliane' },
    { keyword: 'Intyoza', teacher: 'MUTESI Liliane' },
    { keyword: 'kiboneye', teacher: 'MUTESI Liliane' },
    
    // Kiswahili teachers
    { keyword: 'Kiswahili', teacher: 'NSABIMANA Anastase' },
    { keyword: 'kiswahili', teacher: 'NSABIMANA Anastase' },
    { keyword: 'Kazini', teacher: 'NSABIMANA Anastase' },
    
    // ICT/Computer teachers
    { keyword: 'ICT', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Computer', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Cloud Computing', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Blockchain', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Flutter', teacher: 'HARERIMANA Eugene' },
    { keyword: 'NoSQL', teacher: 'HARERIMANA Eugene' },
    { keyword: 'DevOps', teacher: 'HARERIMANA Eugene' },
    { keyword: 'python', teacher: 'HARERIMANA Eugene' },
    { keyword: 'JavaScript', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Vue Design', teacher: 'HARERIMANA Eugene' },
    { keyword: 'UI/UX', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Version Control', teacher: 'HARERIMANA Eugene' },
    { keyword: 'website', teacher: 'HARERIMANA Eugene' },
    { keyword: 'graphics', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Data Structures', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Algorithms', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Windows Server', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Kernel', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Hardware Architecture', teacher: 'HARERIMANA Eugene' },
    
    // Software Development teachers
    { keyword: 'Software Development', teacher: 'MUGIRANEZA Laurent' },
    { keyword: 'Software', teacher: 'MUGIRANEZA Laurent' },
    
    // Religion teachers
    { keyword: 'Religion', teacher: 'Padri HABIMANA Pascal' },
    { keyword: 'ethics', teacher: 'Padri HABIMANA Pascal' },
    { keyword: 'Citizenship', teacher: 'Padri HABIMANA Pascal' },
    { keyword: 'multicultural', teacher: 'Padri HABIMANA Pascal' },
    { keyword: 'harmony', teacher: 'Padri HABIMANA Pascal' },
    
    // Entrepreneurship/Business teachers
    { keyword: 'Business', teacher: 'Pascal Habimana' },
    { keyword: 'business', teacher: 'Pascal Habimana' },
    { keyword: 'Entrepreneurship', teacher: 'Pascal Habimana' },
    { keyword: 'business plan', teacher: 'Pascal Habimana' },
    
    // Quality Assurance
    { keyword: 'Quality Assurance', teacher: 'UWIKUNDA Esther' },
    
    // General/Fallback
    { keyword: 'Citizenship values', teacher: 'Padri HABIMANA Pascal' },
    { keyword: 'living together', teacher: 'Padri HABIMANA Pascal' },
  ];
  
  console.log('\n=== CREATING TEACHER-SUBJECT MAPPINGS ===\n');
  
  let mappingCount = 0;
  let skipCount = 0;
  
  for (const subject of subjects) {
    const subjectName = subject.name || '';
    const subjectCode = subject.code || '';
    const searchText = (subjectName + ' ' + subjectCode).toLowerCase();
    
    // Find matching teacher
    let assignedTeacher = null;
    for (const assignment of teacherAssignments) {
      if (searchText.includes(assignment.keyword.toLowerCase())) {
        assignedTeacher = teachers.find(t => t.name === assignment.teacher);
        if (assignedTeacher) break;
      }
    }
    
    if (assignedTeacher) {
      // Check if mapping already exists
      const existing = await db.get(
        'SELECT id FROM teacher_subjects WHERE teacher_id = ? AND subject_id = ?',
        [assignedTeacher.id, subject.id]
      );
      
      if (!existing) {
        await db.run(
          'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)',
          [assignedTeacher.id, subject.id]
        );
        console.log(`✅ ${assignedTeacher.name} → ${subject.name} (${subject.code || 'no code'})`);
        mappingCount++;
      } else {
        skipCount++;
      }
    }
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`New mappings created: ${mappingCount}`);
  console.log(`Already existed: ${skipCount}`);
  
  // Show final mapping count
  const totalMappings = await db.get('SELECT COUNT(*) as count FROM teacher_subjects');
  console.log(`Total teacher-subject mappings: ${totalMappings.count}`);
  
  await db.close();
  console.log('\nDone!');
})();
