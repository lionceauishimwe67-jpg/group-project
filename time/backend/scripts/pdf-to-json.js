const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

// Known subject patterns for Rwandan curriculum
const SUBJECT_PATTERNS = [
  'Mathematics', 'English', 'French', 'Physics', 'Chemistry', 'Biology',
  'History', 'Geography', 'ICT', 'Kinyarwanda', 'Physical Education', 'Sport',
  'Religion', 'Entrepreneurship', 'Computer Science', 'Software Development',
  'Networking', 'Network Administration', 'Fashion Design', 'Web Development',
  'Database Management', 'Python', 'Accounting', 'Economics', 'Literature',
  'Civic Education', 'General Studies', 'Art', 'Music', 'Library', 'Study Hall',
  'Debate', 'Club', 'CPD', 'Assembly', 'Break', 'Lunch', 'Test'
];

// Teacher lookup from database
let teacherBySubject = {};
let fallbackTeachers = {};

async function loadTeacherMappings() {
  try {
    const dbPath = path.join(__dirname, '..', 'database.sqlite');
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    
    const mappings = await db.all(`
      SELECT t.name as teacher_name, s.name as subject_name
      FROM teacher_subjects ts
      JOIN teachers t ON ts.teacher_id = t.id
      JOIN subjects s ON ts.subject_id = s.id
    `);
    mappings.forEach(m => {
      teacherBySubject[m.subject_name.toLowerCase()] = m.teacher_name;
    });
    
    const teachers = await db.all(`SELECT id, name FROM teachers`);
    fallbackTeachers = {
      'mathematics': 'KARENZI Faustin',
      'english': 'Alice Uwase',
      'french': 'Claudine Mukamana',
      'physics': 'HAGENIMANA Fidele',
      'chemistry': 'NYIRAKANYAMNA Beatitude',
      'biology': 'MUKAMUGEMa Viviane',
      'history': 'MUSIGI Jean Paul',
      'geography': 'NDABAKURANYE Pierre Claver',
      'ict': 'HARERIMANA Eugene',
      'kinyarwanda': 'MUTESI Liliane',
      'physical education': 'MUSAFIRI Anastase',
      'religion': 'Padri HABIMANA Pascal',
      'entrepreneurship': 'Pascal Habimana',
      'networking': 'IRARORA Jean Damascene',
      'software development': 'MUGIRANEZA Laurent',
      'fashion design': 'USANASE Ange',
      'computer science': 'HARERIMANA Eugene',
      'web development': 'NIYODUSENGA Aaron',
      'database management': 'MUGIRANEZA Laurent',
      'python': 'NTIBIBUKA Eraste',
      'accounting': 'Jean Mugisha',
      'economics': 'Jean Mugisha',
      'literature': 'Alice Uwase',
      'civic education': 'Pascal Habimana',
      'general studies': 'Pascal Habimana',
    };
    
    await db.close();
  } catch (e) {
    console.log('⚠️  Could not load teacher mappings:', e.message);
  }
}

// Extract class name from PDF text
function extractClassName(text) {
  const patterns = [
    /(?:CLASS|LEVEL|GRADE|PROMOTION|SENIOR)\s*[:=]?\s*([A-Z0-9][A-Z0-9\s\-/]{2,50})/i,
    /(L[345]\s*(?:NIT|SWD|FAD|CSA))/i,
    /(LEVEL\s*[IVX]+\s+[A-Z][A-Z\s&\-/]{2,50})/i,
    /(SENIOR\s+[IVX]+\s+\w+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return 'Unknown';
}

// Extract time slots from PDF text
function extractTimeSlots(text) {
  const timeSlots = new Set();
  const timePattern = /(\d{1,2})[:\.](\d{2})\s*[-–—~to]+\s*(\d{1,2})[:\.](\d{2})/gi;
  let match;
  
  while ((match = timePattern.exec(text)) !== null) {
    const start = `${match[1].padStart(2, '0')}:${match[2]}`;
    const end = `${match[3].padStart(2, '0')}:${match[4]}`;
    timeSlots.add(`${start}-${end}`);
  }
  
  return Array.from(timeSlots).sort();
}

// Extract subjects and count their occurrences
function extractSubjects(text) {
  const subjectCounts = new Map();
  const lines = text.split(/\r?\n/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 3 || trimmed.length > 100) continue;
    
    for (const subject of SUBJECT_PATTERNS) {
      const escaped = subject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(trimmed)) {
        const key = subject.toLowerCase();
        subjectCounts.set(key, (subjectCounts.get(key) || 0) + 1);
      }
    }
  }
  
  // Remove non-subject entries (break, lunch, etc.)
  const exclude = ['break', 'lunch', 'assembly', 'test', 'cpd', 'club', 'debate', 'study hall', 'library'];
  exclude.forEach(e => subjectCounts.delete(e));
  
  return subjectCounts;
}

// Parse PDF and convert to JSON template
async function pdfToJson(filePath, classId = null, className = null) {
  console.log(`\n📄 Processing: ${path.basename(filePath)}`);
  
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text || '';
    
    if (!text || text.length < 50) {
      console.log(`  ⚠️  PDF appears empty or contains only images (OCR needed)`);
      return null;
    }
    
    // Extract data
    const extractedClassName = className || extractClassName(text);
    const timeSlots = extractTimeSlots(text);
    const subjectCounts = extractSubjects(text);
    
    console.log(`  📛 Class: ${extractedClassName}`);
    console.log(`  ⏰ Time slots: ${timeSlots.length}`);
    console.log(`  📚 Subjects found: ${subjectCounts.size}`);
    
    // Build subjects array
    const subjects = [];
    for (const [subjectKey, count] of subjectCounts) {
      const subjectName = SUBJECT_PATTERNS.find(s => s.toLowerCase() === subjectKey) || subjectKey;
      const teacher = teacherBySubject[subjectKey] || fallbackTeachers[subjectKey] || 'Unassigned';
      
      // Estimate hours per week based on occurrence count
      // Typically 1 occurrence in PDF = 1-2 periods per week
      let hours = Math.max(2, Math.round(count / 2));
      if (['mathematics', 'english', 'software development', 'networking', 'fashion design', 'computer science'].includes(subjectKey)) {
        hours = Math.max(4, hours);
      }
      
      let availability = 'Full Day';
      if (['mathematics', 'physics', 'chemistry', 'french'].includes(subjectKey)) {
        availability = 'Morning';
      } else if (['history', 'geography', 'physical education', 'sport', 'religion'].includes(subjectKey)) {
        availability = 'Afternoon';
      }
      
      subjects.push({
        name: subjectName,
        teacher: teacher,
        hours_per_week: hours,
        availability: availability
      });
    }
    
    // Default time slots if none extracted
    const finalTimeSlots = timeSlots.length > 0 ? timeSlots : [
      '08:00-09:00', '09:00-10:00', '10:30-11:30',
      '11:30-12:30', '13:30-14:30', '14:30-15:30'
    ];
    
    const template = {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      classes: [{
        id: classId || 0,
        name: extractedClassName,
        level: extractedClassName.substring(0, 2) || 'Unknown',
        students: 40
      }],
      subjects: subjects,
      rules: [
        'A teacher cannot teach two classes at the same time',
        'Subject hours must match weekly requirements',
        'Avoid repeating the same subject more than 2 times in one day',
        'Teachers must follow availability constraints',
        'Every class must have a balanced schedule',
        'Core subjects (Math, English, Physics) should be in morning slots',
        'Break times must be respected'
      ],
      time_slots: finalTimeSlots,
      classId: classId || 0
    };
    
    return template;
  } catch (e) {
    console.log(`  ❌ Error parsing PDF: ${e.message}`);
    return null;
  }
}

// Main function
async function main() {
  await loadTeacherMappings();
  
  const uploadDir = path.join(__dirname, '..', 'uploads', 'chronograms');
  const outputDir = path.join(__dirname, '..', 'timetable-templates', 'from-pdf');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Find all PDF files
  const pdfFiles = fs.readdirSync(uploadDir)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .map(f => path.join(uploadDir, f));
  
  if (pdfFiles.length === 0) {
    console.log('❌ No PDF files found in uploads/chronograms');
    return;
  }
  
  console.log(`🔍 Found ${pdfFiles.length} PDF files to process\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const pdfFile of pdfFiles) {
    const fileName = path.basename(pdfFile, '.pdf');
    
    // Try to extract class ID from filename
    const classMatch = fileName.match(/(L[345](?:NIT|SWD|FAD|CSA))/i);
    let className = classMatch ? classMatch[1].toUpperCase() : null;
    
    // Look up class ID if we have a class name
    let classId = null;
    if (className) {
      try {
        const dbPath = path.join(__dirname, '..', 'database.sqlite');
        const db = await open({ filename: dbPath, driver: sqlite3.Database });
        const result = await db.get(`SELECT id FROM classes WHERE name LIKE ?`, [`${className}%`]);
        if (result) classId = result.id;
        await db.close();
      } catch (e) { /* ignore */ }
    }
    
    const template = await pdfToJson(pdfFile, classId, className);
    
    if (template && template.subjects.length > 0) {
      const outFileName = `${className || fileName}_template.json`;
      const outPath = path.join(outputDir, outFileName);
      fs.writeFileSync(outPath, JSON.stringify(template, null, 2));
      console.log(`  ✅ Saved: ${outFileName} (${template.subjects.length} subjects)`);
      successCount++;
    } else {
      console.log(`  ⚠️  Skipped: Could not extract meaningful data`);
      failCount++;
    }
  }
  
  console.log(`\n📊 Summary: ${successCount} succeeded, ${failCount} failed`);
}

main().catch(console.error);
