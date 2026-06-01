const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

// ============================================================
// TEACHER & SUBJECT DATABASE LOOKUP
// ============================================================
let teacherByName = {};
let classByName = {};

async function loadDatabaseMappings() {
  try {
    const dbPath = path.join(__dirname, '..', 'database.sqlite');
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    
    const teachers = await db.all(`SELECT id, name FROM teachers`);
    teachers.forEach(t => {
      teacherByName[t.name.toLowerCase()] = { id: t.id, name: t.name };
    });
    
    const classes = await db.all(`SELECT id, name FROM classes`);
    classes.forEach(c => {
      classByName[c.name.toLowerCase()] = { id: c.id, name: c.name };
    });
    
    await db.close();
  } catch (e) {
    console.log('⚠️  Could not load DB mappings:', e.message);
  }
}

// ============================================================
// FORMAT DETECTION
// ============================================================
function detectFormat(text) {
  const lower = text.toLowerCase();
  
  if (lower.includes('machine readable sample') || lower.includes('weekly timetable grid')) {
    return 'clean_timetable';
  }
  
  // AI Timetable Testing Table Template format
  if (lower.includes('ai timetable testing') || (lower.includes('daytimeclasssubjectteacher') && /\b(monday|tuesday|wednesday|thursday|friday)\b/i.test(text))) {
    return 'testing_template';
  }
  
  // TVET curriculum: has module names starting with verbs, module codes, periods grid
  if (lower.includes('republic of rwanda') || lower.includes('ministry of education') ||
      /\b(apply|develop|use|organize|integrate|gukoresha|kutumia)\b/i.test(text) &&
      /[A-Z]{2,7}\d{3}/.test(text)) {
    return 'tvet_curriculum';
  }
  
  if (/[A-Z]{2,7}\d{3}/.test(text) && (lower.includes('modules hours') || lower.includes('modules periods') || lower.includes('qualification title'))) {
    return 'tvet_curriculum';
  }
  
  return 'unknown';
}

// ============================================================
// CLEAN TIMETABLE PARSER
// ============================================================
function parseCleanTimetable(text) {
  const result = {
    className: '',
    classId: null,
    subjects: [],
    timeSlots: [],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    assembly: null,
    breaks: [],
    lunch: null
  };
  
  // 1. Try to extract machine-readable JSON section first
  const jsonStartIdx = text.indexOf('MACHINE READABLE SAMPLE');
  if (jsonStartIdx >= 0) {
    const afterMarker = text.substring(jsonStartIdx);
    const firstBrace = afterMarker.indexOf('{');
    if (firstBrace >= 0) {
      // Extract JSON by counting braces
      let braceCount = 0;
      let jsonEnd = firstBrace;
      for (let i = firstBrace; i < afterMarker.length; i++) {
        if (afterMarker[i] === '{') braceCount++;
        if (afterMarker[i] === '}') braceCount--;
        if (braceCount === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
      
      const jsonText = afterMarker.substring(firstBrace, jsonEnd);
      
      try {
        const data = JSON.parse(jsonText);
        
        // Extract class info
        if (data.class) {
          result.className = data.class.name || '';
          result.classId = data.class.id || null;
          const dbClass = classByName[result.className.toLowerCase()];
          if (dbClass) result.classId = dbClass.id;
        }
        
        // Extract subjects if available
        if (data.subjects && Array.isArray(data.subjects)) {
          for (const sub of data.subjects) {
            const teacherName = Array.isArray(sub.teachers) ? sub.teachers[0] : sub.teacher;
            const teacher = teacherByName[(teacherName || '').toLowerCase()] || { id: null, name: teacherName || 'Unassigned' };
            result.subjects.push({
              code: sub.code || sub.name || '',
              name: sub.name || sub.code || '',
              teacher: teacher.name,
              teacherId: teacher.id,
              hours_per_week: sub.periodsPerWeek || sub.hours_per_week || 3,
              availability: 'Full Day'
            });
          }
        }
        
        // Extract time slots
        if (data.timeSlots && Array.isArray(data.timeSlots)) {
          result.timeSlots = data.timeSlots.map(s => {
            if (typeof s === 'string') {
              return s.replace(/['"]/g, '').replace(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/, 
                (_, h1, m1, h2, m2) => `${h1.padStart(2,'0')}:${m1}-${h2.padStart(2,'0')}:${m2}`);
            }
            return s;
          });
        }
        
        if (result.subjects.length > 0) return result;
      } catch (e) {
        console.log(`    ⚠️  JSON parse error: ${e.message}`);
        console.log(`    ⚠️  JSON text length: ${jsonText.length}`);
        console.log(`    ⚠️  First 200 chars: ${jsonText.slice(0, 200)}`);
      }
    }
  }
  
  // 2. Extract class name from header
  if (!result.className) {
    const classMatch = text.match(/Class\s*[:\|]\s*([^\n]+)/i);
    if (classMatch) {
      result.className = classMatch[1].trim().split(' - ')[0].trim();
      const dbClass = classByName[result.className.toLowerCase()];
      if (dbClass) result.classId = dbClass.id;
    }
  }
  
  // 3. Extract fixed periods
  const fixedMatch = text.match(/Fixed periods\s*[:\|]\s*([^\n]+)/i);
  if (fixedMatch) {
    const fixed = fixedMatch[1];
    const assemblyMatch = fixed.match(/Assembly\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/i);
    if (assemblyMatch) result.assembly = { start: assemblyMatch[1], end: assemblyMatch[2] };
    const breakMatches = [...fixed.matchAll(/Break\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/gi)];
    for (const m of breakMatches) result.breaks.push({ start: m[1], end: m[2] });
    const lunchMatch = fixed.match(/Lunch\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/i);
    if (lunchMatch) result.lunch = { start: lunchMatch[1], end: lunchMatch[2] };
  }
  
  // 4. Extract subjects from the timetable grid (CODE - TEACHER NAME format)
  const gridSection = text.match(/WEEKLY TIMETABLE GRID[\s\S]*?(?=MACHINE READABLE SAMPLE|$)/i);
  if (gridSection && result.subjects.length === 0) {
    const gridText = gridSection[0];
    // Find all "CODE - TEACHER NAME" patterns
    const cellMatches = [...gridText.matchAll(/\b([A-Z]{2,7})\s*[-–—]\s*([A-Z][A-Za-z\s,']+?)(?=\s*$|\s*[A-Z]{2,7}\s*[-–—])/gm)];
    const seenSubjects = new Set();
    
    for (const m of cellMatches) {
      const code = m[1];
      const teacherName = m[2].trim();
      const key = code;
      
      if (!seenSubjects.has(key)) {
        seenSubjects.add(key);
        const teacher = teacherByName[teacherName.toLowerCase()] || { id: null, name: teacherName };
        result.subjects.push({
          code: code,
          name: code,
          teacher: teacher.name,
          teacherId: teacher.id,
          hours_per_week: 3,
          availability: 'Full Day'
        });
      }
    }
    
    // Also extract from SUBJECTS AND TEACHERS section for periods/week
    const subjectSection = text.match(/SUBJECTS AND TEACHERS[\s\S]*?(?=WEEKLY TIMETABLE GRID)/i);
    if (subjectSection) {
      const lines = subjectSection[0].split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.includes('Subject') || trimmed.includes('Teacher') || trimmed.includes('Use this section')) continue;
        
        // Try all possible code lengths (2-7)
        for (let codeLen = 7; codeLen >= 2; codeLen--) {
          if (trimmed.length <= codeLen + 2) continue;
          const code = trimmed.substring(0, codeLen);
          if (!/^[A-Z]{2,7}$/.test(code)) continue;
          
          const rest = trimmed.substring(codeLen);
          const teacherMatch = rest.match(/^([A-Z][A-Za-z\s,']+?)(\d{1,2})\s*$/);
          if (teacherMatch) {
            const [, teacherName, periods] = teacherMatch;
            const existing = result.subjects.find(s => s.code === code);
            if (existing) {
              existing.hours_per_week = parseInt(periods);
              const teacher = teacherByName[teacherName.trim().toLowerCase()] || { id: null, name: teacherName.trim() };
              existing.teacher = teacher.name;
              existing.teacherId = teacher.id;
            }
            break;
          }
        }
      }
    }
  }
  
  // 5. Extract time slots from the grid
  if (result.timeSlots.length === 0) {
    const timeSlotMatches = [...text.matchAll(/(\d{1,2})[:'](\d{2})['']?\s*[-–—]\s*(\d{1,2})[:'](\d{2})['']/g)];
    const seen = new Set();
    for (const m of timeSlotMatches) {
      const start = `${m[1].padStart(2, '0')}:${m[2]}`;
      const end = `${m[3].padStart(2, '0')}:${m[4]}`;
      const key = `${start}-${end}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.timeSlots.push(key);
      }
    }
    result.timeSlots.sort();
  }
  
  return result;
}

// ============================================================
// TESTING TEMPLATE PARSER
// ============================================================
function parseTestingTemplate(text) {
  const result = {
    className: '',
    classId: null,
    subjects: [],
    timeSlots: [],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    assembly: null,
    breaks: [],
    lunch: null
  };
  
  // Extract entries: Day + Time + Class + Subject + Teacher
  // e.g., "Monday08:00-09:00S1AMathematicsJean Claude"
  const entryMatches = [...text.matchAll(/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*(\d{1,2}[:.]\d{2}\s*[-–—~]\s*\d{1,2}[:.]\d{2})\s*([A-Z0-9][A-Z0-9_]*)\s*([A-Z][a-zA-Z\s]+?)\s*([A-Z][a-zA-Z\s]+?)$/gm)];
  
  const seenSubjects = new Set();
  const seenTimes = new Set();
  
  for (const m of entryMatches) {
    const [, day, time, className, subject, teacher] = m;
    
    if (!result.className) {
      result.className = className.trim();
      const dbClass = classByName[result.className.toLowerCase()];
      if (dbClass) result.classId = dbClass.id;
    }
    
    // Normalize time
    const normalizedTime = time.replace(/\s+/g, '').replace(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/,
      (_, h1, m1, h2, m2) => `${h1.padStart(2,'0')}:${m1}-${h2.padStart(2,'0')}:${m2}`);
    
    if (!seenTimes.has(normalizedTime)) {
      seenTimes.add(normalizedTime);
      result.timeSlots.push(normalizedTime);
    }
    
    const subjectKey = subject.trim().toLowerCase();
    if (!seenSubjects.has(subjectKey)) {
      seenSubjects.add(subjectKey);
      const teacherObj = teacherByName[teacher.trim().toLowerCase()] || { id: null, name: teacher.trim() };
      result.subjects.push({
        code: subject.trim(),
        name: subject.trim(),
        teacher: teacherObj.name,
        teacherId: teacherObj.id,
        hours_per_week: 3,
        availability: 'Full Day'
      });
    }
  }
  
  result.timeSlots.sort();
  
  return result;
}

// ============================================================
// TVET CURRICULUM PARSER
// ============================================================
function parseTvetCurriculum(text) {
  const result = {
    className: '',
    classId: null,
    subjects: [],
    timeSlots: ['08:00-09:00', '09:00-10:00', '10:00-10:30', '10:30-11:30', '11:30-12:30', '12:30-13:30', '13:30-14:30', '14:30-15:30', '15:30-16:00', '16:00-17:00'],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  };
  
  // Extract qualification/trade info
  const qualMatch = text.match(/QUALIFICATION TITLE[:\s]*([^\n]+)/i);
  const tradeMatch = text.match(/(?:TVET Certificate|Diploma|RTQF LEVEL|SECTOR|TRADE)\s+([^\n]+)/i);
  
  if (tradeMatch) {
    result.className = tradeMatch[1].trim();
  } else if (qualMatch) {
    result.className = qualMatch[1].trim();
  }
  
  // Try to map to known class
  const dbClass = Object.entries(classByName).find(([k]) => k.includes(result.className.toLowerCase().slice(0, 5)));
  if (dbClass) {
    result.className = dbClass[1].name;
    result.classId = dbClass[1].id;
  }
  
  // Extract module codes (pattern: 3-7 uppercase letters + 3 digits, may be concatenated)
  const codeMatches = text.match(/[A-Z]{2,7}\d{3}/g);
  const uniqueCodes = codeMatches ? [...new Set(codeMatches)] : [];
  
  // Extract module names (lines starting with action verbs)
  const moduleLines = text.split('\n').filter(line => {
    const trimmed = line.trim();
    return /^(Apply|Develop|Use|Gukoresha|Echanger|Kutumia|Organize|Integrate)/i.test(trimmed) && trimmed.length > 15 && trimmed.length < 100;
  });
  
  // Map codes to subjects
  for (let i = 0; i < uniqueCodes.length; i++) {
    const code = uniqueCodes[i];
    const moduleName = moduleLines[i] ? moduleLines[i].trim() : code;
    
    result.subjects.push({
      code: code,
      name: moduleName,
      teacher: 'Unassigned',
      teacherId: null,
      hours_per_week: 3,
      availability: 'Full Day'
    });
  }
  
  return result;
}

// ============================================================
// CONVERT TO JSON TEMPLATE FORMAT
// ============================================================
function convertToJsonTemplate(parsed, format) {
  const template = {
    days: parsed.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    classes: [{
      id: parsed.classId || 0,
      name: parsed.className || 'Unknown',
      level: (parsed.className || '').substring(0, 2) || 'Unknown',
      students: 40
    }],
    subjects: parsed.subjects.map(s => ({
      name: s.name,
      teacher: s.teacher,
      hours_per_week: s.hours_per_week || 3,
      availability: s.availability || 'Full Day'
    })),
    rules: [
      'A teacher cannot teach two classes at the same time',
      'Subject hours must match weekly requirements',
      'Avoid repeating the same subject more than 2 times in one day',
      'Teachers must follow availability constraints',
      'Every class must have a balanced schedule',
      'Core subjects should be in morning slots',
      'Break times must be respected'
    ],
    time_slots: parsed.timeSlots.length > 0 ? parsed.timeSlots : [
      '08:00-09:00', '09:00-10:00', '10:00-10:30', '10:30-11:30',
      '11:30-12:30', '12:30-13:30', '13:30-14:30', '14:30-15:30',
      '15:30-16:00', '16:00-17:00'
    ],
    classId: parsed.classId || 0
  };
  
  if (parsed.assembly) {
    template.rules.push(`Assembly is fixed at ${parsed.assembly.start}-${parsed.assembly.end}`);
  }
  if (parsed.lunch) {
    template.rules.push(`Lunch is fixed at ${parsed.lunch.start}-${parsed.lunch.end}`);
  }
  if (parsed.breaks && parsed.breaks.length > 0) {
    parsed.breaks.forEach((b, i) => {
      template.rules.push(`Break ${i + 1} is fixed at ${b.start}-${b.end}`);
    });
  }
  
  return template;
}

// ============================================================
// MAIN FUNCTION
// ============================================================
async function main() {
  await loadDatabaseMappings();
  
  const args = process.argv.slice(2);
  let inputFiles = [];
  
  if (args.length > 0) {
    inputFiles = args.map(a => path.resolve(a));
  } else {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'chronograms');
    const rootDir = path.join(__dirname, '..');
    
    const pdfFiles = [
      ...fs.readdirSync(uploadDir).filter(f => f.toLowerCase().endsWith('.pdf')).map(f => path.join(uploadDir, f)),
      ...fs.readdirSync(rootDir).filter(f => f.toLowerCase().endsWith('.pdf') && f.toLowerCase().includes('timetable')).map(f => path.join(rootDir, f))
    ];
    inputFiles = pdfFiles;
  }
  
  const outputDir = path.join(__dirname, '..', 'timetable-templates', 'from-pdf');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`🔍 Processing ${inputFiles.length} PDF files...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const pdfFile of inputFiles) {
    if (!fs.existsSync(pdfFile)) {
      console.log(`⚠️  File not found: ${pdfFile}`);
      failCount++;
      continue;
    }
    
    console.log(`📄 ${path.basename(pdfFile)}`);
    
    try {
      const dataBuffer = fs.readFileSync(pdfFile);
      const data = await pdfParse(dataBuffer);
      const text = data.text || '';
      
      if (!text || text.length < 50) {
        console.log(`  ⚠️  PDF appears empty or image-only`);
        failCount++;
        continue;
      }
      
      const format = detectFormat(text);
      console.log(`  📋 Format detected: ${format}`);
      
      let parsed;
      if (format === 'clean_timetable') {
        parsed = parseCleanTimetable(text);
      } else if (format === 'testing_template') {
        parsed = parseTestingTemplate(text);
      } else if (format === 'tvet_curriculum') {
        parsed = parseTvetCurriculum(text);
      } else {
        console.log(`  ⚠️  Unknown format, trying generic parser`);
        parsed = parseTvetCurriculum(text);
      }
      
      if (parsed.subjects.length === 0) {
        console.log(`  ⚠️  No subjects extracted`);
        failCount++;
        continue;
      }
      
      const template = convertToJsonTemplate(parsed, format);
      
      const className = parsed.className || path.basename(pdfFile, '.pdf');
      const outFileName = `${className.replace(/[^a-zA-Z0-9]/g, '_')}_template.json`;
      const outPath = path.join(outputDir, outFileName);
      fs.writeFileSync(outPath, JSON.stringify(template, null, 2));
      
      console.log(`  ✅ Class: ${parsed.className || 'Unknown'}`);
      console.log(`  ✅ Subjects: ${template.subjects.length}`);
      console.log(`  ✅ Time slots: ${template.time_slots.length}`);
      console.log(`  ✅ Saved: ${outFileName}`);
      successCount++;
      
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
      failCount++;
    }
    
    console.log();
  }
  
  console.log(`\n📊 Summary: ${successCount} succeeded, ${failCount} failed`);
  console.log(`📁 Templates saved to: ${outputDir}`);
}

main().catch(console.error);
