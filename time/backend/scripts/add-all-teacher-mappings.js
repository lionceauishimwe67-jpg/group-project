const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({ filename: 'database.sqlite', driver: sqlite3.Database });
  
  // Get all teachers
  const teachers = await db.all('SELECT id, name FROM teachers ORDER BY name');
  
  // Get all subjects that don't have a teacher yet
  const subjectsWithoutTeachers = await db.all(`
    SELECT s.id, s.name, s.code
    FROM subjects s
    LEFT JOIN teacher_subjects ts ON s.id = ts.subject_id
    WHERE ts.subject_id IS NULL
    ORDER BY s.name
  `);
  
  console.log(`Subjects without teachers: ${subjectsWithoutTeachers.length}\n`);
  
  // Expanded teacher assignments with more keywords
  const teacherAssignments = [
    // Mathematics teachers
    { keyword: 'math', teacher: 'KARENZI Faustin' },
    { keyword: 'Mathematical', teacher: 'KARENZI Faustin' },
    { keyword: 'Algebra', teacher: 'KARENZI Faustin' },
    { keyword: 'Trigonometry', teacher: 'KARENZI Faustin' },
    { keyword: 'Statistics', teacher: 'KARENZI Faustin' },
    { keyword: 'Probability', teacher: 'KARENZI Faustin' },
    { keyword: 'logarithms', teacher: 'KARENZI Faustin' },
    { keyword: 'exponential', teacher: 'KARENZI Faustin' },
    { keyword: 'GENQA', teacher: 'KARENZI Faustin' },
    { keyword: 'GENAP', teacher: 'KARENZI Faustin' },
    { keyword: 'FADWW', teacher: 'KARENZI Faustin' },
    { keyword: 'SWDVC', teacher: 'KARENZI Faustin' },
    { keyword: 'GENGD', teacher: 'KARENZI Faustin' },
    
    // English teachers
    { keyword: 'English', teacher: 'Alice Uwase' },
    { keyword: 'CCMFT', teacher: 'Alice Uwase' },
    { keyword: 'FADME', teacher: 'Alice Uwase' },
    { keyword: 'FADFA', teacher: 'Alice Uwase' },
    { keyword: 'GENPY', teacher: 'Alice Uwase' },
    
    // French teachers
    { keyword: 'français', teacher: 'Claudine Mukamana' },
    { keyword: 'French', teacher: 'Claudine Mukamana' },
    { keyword: 'CCMIW', teacher: 'Claudine Mukamana' },
    { keyword: 'FADDI', teacher: 'Claudine Mukamana' },
    { keyword: 'FADFC', teacher: 'Claudine Mukamana' },
    
    // Physics teachers
    { keyword: 'physics', teacher: 'HAGENIMANA Fidele' },
    { keyword: 'Physics', teacher: 'HAGENIMANA Fidele' },
    { keyword: 'Dynamics', teacher: 'HAGENIMANA Fidele' },
    { keyword: 'Waves', teacher: 'HAGENIMANA Fidele' },
    { keyword: 'GENAP', teacher: 'HAGENIMANA Fidele' },
    { keyword: 'SWDJF', teacher: 'HAGENIMANA Fidele' },
    
    // Chemistry teachers
    { keyword: 'Chemistry', teacher: 'NYIRAKANYAMNA Beatitude' },
    { keyword: 'CCMCZ', teacher: 'NYIRAKANYAMNA Beatitude' },
    { keyword: 'CCMCZP', teacher: 'NYIRAKANYAMNA Beatitude' },
    
    // Biology teachers
    { keyword: 'Biology', teacher: 'MUKAMUGEMa Viviane' },
    { keyword: 'NITZC', teacher: 'MUKAMUGEMa Viviane' },
    { keyword: 'GENPP', teacher: 'MUKAMUGEMa Viviane' },
    { keyword: 'NITCC', teacher: 'MUKAMUGEMa Viviane' },
    
    // Kinyarwanda teachers
    { keyword: 'ikinyarwanda', teacher: 'MUTESI Liliane' },
    { keyword: 'Kinyarwanda', teacher: 'MUTESI Liliane' },
    { keyword: 'Intyoza', teacher: 'MUTESI Liliane' },
    { keyword: 'kiboneye', teacher: 'MUTESI Liliane' },
    { keyword: 'CCMPE', teacher: 'MUTESI Liliane' },
    { keyword: 'FADMS', teacher: 'MUTESI Liliane' },
    { keyword: 'CCMAT', teacher: 'MUTESI Liliane' },
    
    // Kiswahili teachers
    { keyword: 'Kiswahili', teacher: 'NSABIMANA Anastase' },
    { keyword: 'kiswahili', teacher: 'NSABIMANA Anastase' },
    { keyword: 'Kazini', teacher: 'NSABIMANA Anastase' },
    { keyword: 'CCMKN', teacher: 'NSABIMANA Anastase' },
    { keyword: 'CCMKK', teacher: 'NSABIMANA Anastase' },
    { keyword: 'FADDP', teacher: 'NSABIMANA Anastase' },
    
    // ICT/Computer teachers
    { keyword: 'ICT', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Computer', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Cloud', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Blockchain', teacher: 'HARERIMANA Eugene' },
    { keyword: 'SWDBF', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Flutter', teacher: 'HARERIMANA Eugene' },
    { keyword: 'SWDFA', teacher: 'HARERIMANA Eugene' },
    { keyword: 'NoSQL', teacher: 'HARERIMANA Eugene' },
    { keyword: 'SWDML', teacher: 'HARERIMANA Eugene' },
    { keyword: 'DevOps', teacher: 'HARERIMANA Eugene' },
    { keyword: 'SWDND', teacher: 'HARERIMANA Eugene' },
    { keyword: 'python', teacher: 'HARERIMANA Eugene' },
    { keyword: 'SWDOT', teacher: 'HARERIMANA Eugene' },
    { keyword: 'JavaScript', teacher: 'HARERIMANA Eugene' },
    { keyword: 'SWDUX', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Vue', teacher: 'HARERIMANA Eugene' },
    { keyword: 'SWDVF', teacher: 'HARERIMANA Eugene' },
    { keyword: 'UI/UX', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Version', teacher: 'HARERIMANA Eugene' },
    { keyword: 'website', teacher: 'HARERIMANA Eugene' },
    { keyword: 'SWDPR', teacher: 'HARERIMANA Eugene' },
    { keyword: 'SWDWD', teacher: 'HARERIMANA Eugene' },
    { keyword: 'graphics', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Data Structures', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Algorithms', teacher: 'HARERIMANA Eugene' },
    { keyword: 'CSACH', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Windows Server', teacher: 'HARERIMANA Eugene' },
    { keyword: 'CSAHK', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Kernel', teacher: 'HARERIMANA Eugene' },
    { keyword: 'CSAPS', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Hardware', teacher: 'HARERIMANA Eugene' },
    { keyword: 'CSASA', teacher: 'HARERIMANA Eugene' },
    { keyword: 'Power', teacher: 'HARERIMANA Eugene' },
    { keyword: 'CCMCI', teacher: 'HARERIMANA Eugene' },
    { keyword: 'CCMCB', teacher: 'HARERIMANA Eugene' },
    { keyword: 'CCMCL', teacher: 'HARERIMANA Eugene' },
    { keyword: 'CCMHE', teacher: 'HARERIMANA Eugene' },
    { keyword: 'CCMCS', teacher: 'HARERIMANA Eugene' },
    { keyword: 'CCMKS', teacher: 'HARERIMANA Eugene' },
    
    // Software Development teachers
    { keyword: 'Software', teacher: 'MUGIRANEZA Laurent' },
    { keyword: 'SWD', teacher: 'MUGIRANEZA Laurent' },
    { keyword: 'SWDIA', teacher: 'MUGIRANEZA Laurent' },
    
    // Networking teachers
    { keyword: 'Network', teacher: 'IRARORA Jean Damascene' },
    { keyword: 'NIT', teacher: 'IRARORA Jean Damascene' },
    { keyword: 'NITCS', teacher: 'IRARORA Jean Damascene' },
    { keyword: 'NITML', teacher: 'IRARORA Jean Damascene' },
    { keyword: 'NITLS', teacher: 'IRARORA Jean Damascene' },
    { keyword: 'NITIAP', teacher: 'IRARORA Jean Damascene' },
    { keyword: 'Internet', teacher: 'IRARORA Jean Damascene' },
    
    // Web Development teachers
    { keyword: 'Web', teacher: 'NIYODUSENGA Aaron' },
    { keyword: 'WEB', teacher: 'NIYODUSENGA Aaron' },
    { keyword: 'NITWI', teacher: 'NIYODUSENGA Aaron' },
    
    // Database teachers
    { keyword: 'Database', teacher: 'MUGIRANEZA Laurent' },
    { keyword: 'DBMS', teacher: 'MUGIRANEZA Laurent' },
    { keyword: 'NITL', teacher: 'MUGIRANEZA Laurent' },
    
    // Religion/Ethics teachers
    { keyword: 'Religion', teacher: 'Padri HABIMANA Pascal' },
    { keyword: 'ethics', teacher: 'Padri HABIMANA Pascal' },
    { keyword: 'Citizenship', teacher: 'Padri HABIMANA Pascal' },
    { keyword: 'multicultural', teacher: 'Padri HABIMANA Pascal' },
    { keyword: 'harmony', teacher: 'Padri HABIMANA Pascal' },
    { keyword: 'GENEP', teacher: 'Padri HABIMANA Pascal' },
    { keyword: 'GENDW', teacher: 'Padri HABIMANA Pascal' },
    { keyword: 'GENCC', teacher: 'Padri HABIMANA Pascal' },
    { keyword: 'living together', teacher: 'Padri HABIMANA Pascal' },
    { keyword: 'CCMEN', teacher: 'Padri HABIMANA Pascal' },
    
    // Entrepreneurship/Business teachers
    { keyword: 'Business', teacher: 'Pascal Habimana' },
    { keyword: 'business', teacher: 'Pascal Habimana' },
    { keyword: 'Entrepreneurship', teacher: 'Pascal Habimana' },
    { keyword: 'FADMW', teacher: 'Pascal Habimana' },
    { keyword: 'FADWJ', teacher: 'Pascal Habimana' },
    { keyword: 'GENAC', teacher: 'Pascal Habimana' },
    
    // Quality Assurance teachers
    { keyword: 'Quality', teacher: 'UWIKUNDA Esther' },
    { keyword: 'GENQA', teacher: 'UWIKUNDA Esther' },
    { keyword: 'GENWS', teacher: 'UWIKUNDA Esther' },
    
    // Accounting teachers
    { keyword: 'Accounting', teacher: 'NZAMBAZAMARIYA Concilie' },
    { keyword: 'ACC', teacher: 'NZAMBAZAMARIYA Concilie' },
    { keyword: 'CCMBO', teacher: 'NZAMBAZAMARIYA Concilie' },
    { keyword: 'CCMBP', teacher: 'NZAMBAZAMARIYA Concilie' },
    { keyword: 'CCMB', teacher: 'NZAMBAZAMARIYA Concilie' },
    
    // History teachers
    { keyword: 'History', teacher: 'MUSIGI Jean Paul' },
    { keyword: 'CCMKN', teacher: 'MUSIGI Jean Paul' },
    
    // Geography teachers
    { keyword: 'Geography', teacher: 'NDABAKURANYE Pierre Claver' },
    
    // Physical Education teachers
    { keyword: 'Physical', teacher: 'MUSAFIRI Anastase' },
    { keyword: 'Sport', teacher: 'MUSAFIRI Anastase' },
    { keyword: 'GENSP', teacher: 'MUSAFIRI Anastase' },
    { keyword: 'SPORT', teacher: 'MUSAFIRI Anastase' },
    
    // Taxation teachers
    { keyword: 'Taxation', teacher: 'UWIKUNDA Esther' },
    { keyword: 'TAX', teacher: 'UWIKUNDA Esther' },
    
    // Fashion Design teachers
    { keyword: 'Fashion', teacher: 'USANASE Ange' },
    { keyword: 'FAD', teacher: 'USANASE Ange' },
    { keyword: 'FADJS', teacher: 'USANASE Ange' },
    { keyword: 'FADHP', teacher: 'USANASE Ange' },
    { keyword: 'FADHS', teacher: 'USANASE Ange' },
    { keyword: 'FADHW', teacher: 'USANASE Ange' },
    { keyword: 'FADIAP', teacher: 'USANASE Ange' },
    { keyword: 'FADGC', teacher: 'USANASE Ange' },
    { keyword: 'FADSA', teacher: 'USANASE Ange' },
    { keyword: 'FADFM', teacher: 'USANASE Ange' },
    { keyword: 'FADPM', teacher: 'USANASE Ange' },
    { keyword: 'FADME', teacher: 'USANASE Ange' },
    { keyword: 'FADWW', teacher: 'USANASE Ange' },
    { keyword: 'FADWW', teacher: 'KARENZI Faustin' },
    
    // General Studies
    { keyword: 'General Studies', teacher: 'Pascal Habimana' },
    { keyword: 'GENST', teacher: 'Pascal Habimana' },
    { keyword: 'GENFA', teacher: 'Pascal Habimana' },
    
    // Computer Science Architecture
    { keyword: 'CSA', teacher: 'HARERIMANA Eugene' },
    { keyword: 'CSAIA', teacher: 'HARERIMANA Eugene' },
    
    // Break/Lunch/Special
    { keyword: 'BREAK', teacher: 'MUSAFIRI Anastase' },
    { keyword: 'LUNCH', teacher: 'MUSAFIRI Anastase' },
    { keyword: 'ASSEMBLY', teacher: 'Padri HABIMANA Pascal' },
    { keyword: 'DEBATE', teacher: 'Alice Uwase' },
    { keyword: 'CPD', teacher: 'Pascal Habimana' },
    { keyword: 'TEST', teacher: 'KARENZI Faustin' },
    { keyword: 'CLUB', teacher: 'MUSAFIRI Anastase' },
    { keyword: 'STUDY', teacher: 'MUTESI Liliane' },
    { keyword: 'LIBRARY', teacher: 'Alice Uwase' },
    
    // Fallback: assign remaining to first available teacher
  ];
  
  console.log('=== CREATING TEACHER-SUBJECT MAPPINGS ===\n');
  
  let mappingCount = 0;
  let skipCount = 0;
  let noMatchCount = 0;
  
  for (const subject of subjectsWithoutTeachers) {
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
      const existing = await db.get(
        'SELECT id FROM teacher_subjects WHERE teacher_id = ? AND subject_id = ?',
        [assignedTeacher.id, subject.id]
      );
      
      if (!existing) {
        await db.run(
          'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)',
          [assignedTeacher.id, subject.id]
        );
        console.log(`✅ ${assignedTeacher.name} → ${subject.name.substring(0, 50)} (${subject.code || 'no code'})`);
        mappingCount++;
      } else {
        skipCount++;
      }
    } else {
      noMatchCount++;
      console.log(`⚠️  No teacher match: ${subject.name.substring(0, 50)} (${subject.code || 'no code'})`);
    }
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`New mappings created: ${mappingCount}`);
  console.log(`Already existed: ${skipCount}`);
  console.log(`No teacher match: ${noMatchCount}`);
  
  const totalMappings = await db.get('SELECT COUNT(*) as count FROM teacher_subjects');
  console.log(`Total teacher-subject mappings: ${totalMappings.count}`);
  
  await db.close();
  console.log('\nDone!');
})();
