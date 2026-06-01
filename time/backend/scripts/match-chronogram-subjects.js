const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({ filename: 'database.sqlite', driver: sqlite3.Database });
  
  // Get all subjects and teachers from database
  const dbSubjects = await db.all('SELECT id, name, code FROM subjects ORDER BY name');
  const dbTeachers = await db.all('SELECT id, name, phone FROM teachers ORDER BY name');
  const teacherSubjects = await db.all(`
    SELECT ts.teacher_id, ts.subject_id, t.name as teacher_name, s.name as subject_name, s.code as subject_code
    FROM teacher_subjects ts
    JOIN teachers t ON ts.teacher_id = t.id
    JOIN subjects s ON ts.subject_id = s.id
    ORDER BY t.name, s.name
  `);
  
  console.log('=== DATABASE SUMMARY ===');
  console.log('Subjects:', dbSubjects.length);
  console.log('Teachers:', dbTeachers.length);
  console.log('Teacher-Subject Mappings:', teacherSubjects.length);
  console.log('');
  
  // Get all PDF files
  const uploadDir = path.join(__dirname, '..', 'uploads', 'chronograms');
  const pdfFiles = fs.readdirSync(uploadDir).filter(f => f.toLowerCase().endsWith('.pdf'));
  
  console.log('=== PROCESSING', pdfFiles.length, 'PDF FILES ===\n');
  
  const allExtractedSubjects = new Map(); // code -> { name, count, files }
  
  for (const pdfFile of pdfFiles) {
    const filePath = path.join(uploadDir, pdfFile);
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      const text = data.text || '';
      
      if (!text || text.length < 50) continue;
      
      // Extract module codes
      const codeMatches = text.match(/[A-Z]{2,7}\d{3}/g);
      const uniqueCodes = codeMatches ? [...new Set(codeMatches)] : [];
      
      // Extract module names
      const moduleText = text.replace(/\r?\n/g, ' ');
      const moduleSplitRegex = /((?:Apply|Develop|Use|Gukoresha|Echanger|Kutumia|Organize|Integrate)[^.]+?)(?=(?:Apply|Develop|Use|Gukoresha|Echanger|Kutumia|Organize|Integrate)|$)/gi;
      const moduleNames = [];
      let match;
      while ((match = moduleSplitRegex.exec(moduleText)) !== null) {
        const name = match[1].trim();
        if (name.length > 10 && name.length < 150) {
          moduleNames.push(name);
        }
      }
      
      // Extract class name
      const tradeMatch = text.match(/(?:TVET Certificate|Diploma|RTQF LEVEL|SECTOR|TRADE)\s+([^\n]+)/i);
      const qualMatch = text.match(/QUALIFICATION TITLE[:\s]*([^\n]+)/i);
      let className = tradeMatch ? tradeMatch[1].trim() : (qualMatch ? qualMatch[1].trim() : 'Unknown');
      
      console.log(`📄 ${pdfFile}`);
      console.log(`   Class: ${className}`);
      console.log(`   Codes: ${uniqueCodes.length}, Names: ${moduleNames.length}`);
      
      // Map codes to names
      for (let i = 0; i < uniqueCodes.length; i++) {
        const code = uniqueCodes[i];
        const name = moduleNames[i] || code;
        
        if (!allExtractedSubjects.has(code)) {
          allExtractedSubjects.set(code, { name, count: 0, files: [], dbMatch: null, teacher: null });
        }
        const entry = allExtractedSubjects.get(code);
        entry.count++;
        if (!entry.files.includes(className)) entry.files.push(className);
      }
      
    } catch (e) {
      console.log(`❌ Error reading ${pdfFile}: ${e.message}`);
    }
  }
  
  // Now match each extracted subject to database
  console.log('\n=== SUBJECT MATCHING REPORT ===\n');
  
  let matchCount = 0;
  let noMatchCount = 0;
  const unmatchedSubjects = [];
  
  for (const [code, entry] of allExtractedSubjects) {
    const codeBase = code.replace(/\d+$/, '');
    const nameLower = entry.name.toLowerCase();
    
    // Try to match in database
    let dbMatch = dbSubjects.find(s => 
      s.code?.toLowerCase() === code.toLowerCase() ||
      s.code?.toLowerCase() === codeBase.toLowerCase() ||
      s.name?.toLowerCase() === codeBase.toLowerCase()
    );
    
    // Try keyword matching
    if (!dbMatch) {
      const keywords = ['math', 'english', 'french', 'physics', 'chemistry', 'biology', 
        'history', 'geography', 'ict', 'computer', 'kinyarwanda', 'kiswahili', 'swahili',
        'sport', 'physical', 'religion', 'entrepreneurship', 'blockchain', 'frontend', 
        'react', 'mobile', 'flutter', 'machine learning', 'nosql', 'devops', 'python',
        'quality', 'statistics', 'dynamics', 'waves', 'ethics', 'workplace', 'harmony',
        'business', 'software', 'network', 'internet', 'web', 'database', 'fashion',
        'design', 'art', 'music', 'literature', 'civic', 'general studies', 'logarithm',
        'exponential', 'probability', 'professional', 'multicultural', 'elementaires',
        'intyoza', 'idées', 'français', 'ideas', 'attitude', 'organize', 'business'];
      
      for (const keyword of keywords) {
        if (nameLower.includes(keyword) || entry.name.toLowerCase().includes(keyword)) {
          dbMatch = dbSubjects.find(s =>
            s.name?.toLowerCase().includes(keyword) ||
            s.code?.toLowerCase().includes(keyword)
          );
          if (dbMatch) break;
        }
      }
    }
    
    // Find teacher
    let teacher = null;
    if (dbMatch) {
      const rel = teacherSubjects.find(ts => ts.subject_id === dbMatch.id);
      if (rel) teacher = { id: rel.teacher_id, name: rel.teacher_name };
    }
    
    entry.dbMatch = dbMatch;
    entry.teacher = teacher;
    
    if (dbMatch) {
      matchCount++;
      console.log(`✅ ${code}`);
      console.log(`   Name: ${entry.name}`);
      console.log(`   DB Match: ${dbMatch.name} (ID: ${dbMatch.id}, Code: ${dbMatch.code || 'none'})`);
      console.log(`   Teacher: ${teacher ? teacher.name : '⚠️  NO TEACHER'}`);
      console.log(`   Used in: ${entry.files.join(', ')}`);
      console.log('');
    } else {
      noMatchCount++;
      unmatchedSubjects.push({ code, name: entry.name, files: entry.files });
      console.log(`❌ ${code}`);
      console.log(`   Name: ${entry.name}`);
      console.log(`   DB Match: NONE`);
      console.log(`   Used in: ${entry.files.join(', ')}`);
      console.log('');
    }
  }
  
  console.log('=== SUMMARY ===');
  console.log(`Total unique subjects extracted: ${allExtractedSubjects.size}`);
  console.log(`Matched in database: ${matchCount}`);
  console.log(`NOT matched: ${noMatchCount}`);
  console.log(`Teachers found: ${teacherSubjects.length} mappings`);
  
  if (unmatchedSubjects.length > 0) {
    console.log('\n=== UNMATCHED SUBJECTS (need to be added to database) ===\n');
    console.log('INSERT statements to add missing subjects:');
    for (const sub of unmatchedSubjects) {
      const cleanName = sub.name.replace(/'/g, "''");
      const codeBase = sub.code.replace(/\d+$/, '');
      console.log(`INSERT INTO subjects (name, code) VALUES ('${cleanName}', '${codeBase}');`);
    }
  }
  
  await db.close();
})();
