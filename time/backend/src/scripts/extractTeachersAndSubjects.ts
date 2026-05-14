import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Paths to files
const TEACHERS_CONTACT_PATH = path.join(__dirname, '../../../TEACHERS CONTACT.xlsx');
const TIME_TABLE_DIR = path.join(__dirname, '../../../time table');

interface TeacherProfile {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  subjects?: string[];
}

interface SubjectInfo {
  code?: string;
  name: string;
  specificCompetences?: string[];
  generalCompetences?: string[];
  complementaryCompetences?: string[];
}

// Read Excel file and return all sheets
function readExcel(filePath: string): any[] {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return [];
  }
  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  const data: any[] = [];
  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });
    data.push({ sheetName, data: jsonData });
  }
  return data;
}

// Extract teacher profile from TEACHERS CONTACT.xlsx
function extractTeacherProfile(sheets: any[]): TeacherProfile[] {
  const teachers: TeacherProfile[] = [];
  for (const sheet of sheets) {
    console.log(`\nSheet: ${sheet.sheetName}`);
    console.log(`Columns: ${Object.keys(sheet.data[0] || {}).join(', ')}`);
    
    for (const row of sheet.data) {
      if (!row || Object.keys(row).length === 0) continue;
      
      // Try all possible column names (including the actual ones found: S/N, NAMES, CONTACT)
      const name = row['NAMES'] || row['Name'] || row['Teacher'] || row['Teacher Name'] || row['names'] || row['teacher_name'] || 
                   row['Full Name'] || row['full_name'] || row['Nom'] || row['nom'];
      const phone = row['CONTACT'] || row['Phone'] || row['Contact'] || row['Telephone'] || row['phone'] || 
                    row['Tel'] || row['tel'] || row['Mobile'] || row['mobile'];
      const email = row['Email'] || row['email'] || row['E-mail'];
      const subjects = row['Subjects'] || row['Subject'] || row['subjects'] || row['subject'] ||
                      row['Matières'] || row['matières'] || row['Matiere'];
      
      if (name && typeof name === 'string' && name.trim().length > 2) {
        teachers.push({
          name: name.trim(),
          phone: phone ? String(phone).trim() : undefined,
          email: email ? String(email).trim() : undefined,
          subjects: subjects ? String(subjects).split(',').map(s => s.trim()).filter(s => s) : undefined,
        });
      }
    }
  }
  return teachers;
}

// Extract subject competences from time table files
function extractSubjectsFromTimetables(dir: string): SubjectInfo[] {
  const subjects: SubjectInfo[] = [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx') && !f.includes('parsed'));
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    console.log(`\nProcessing file: ${file}`);
    const sheets = readExcel(filePath);
    
    for (const sheet of sheets) {
      console.log(`  Sheet: ${sheet.sheetName}`);
      if (sheet.data.length > 0) {
        console.log(`  Columns: ${Object.keys(sheet.data[0] || {}).join(', ')}`);
        console.log(`  First row sample:`, JSON.stringify(sheet.data[0], null, 2).substring(0, 300));
      }
      
      for (const row of sheet.data) {
        if (!row || Object.keys(row).length === 0) continue;
        
        // Look for competence columns
        const specificComp = row['Specific Competences'] || row['Specific'] || row['specific_competences'] ||
                            row['SPECIFIC COMPETENCES'] || row['Specific competences'];
        const generalComp = row['General Competences'] || row['General'] || row['general_competences'] ||
                           row['GENERAL COMPETENCES'] || row['General competences'];
        const compComp = row['Complementary Competences'] || row['Complementary'] || row['complementary_competences'] ||
                        row['COMPLEMENTARY COMPETENCES'] || row['Complementary competences'];
        const subjectName = row['Subject'] || row['subject'] || row['Module'] || row['module'] ||
                           row['SUBJECT'] || row['COURSE'];
        const subjectCode = row['Code'] || row['code'] || row['Subject Code'] || row['CODE'];
        
        if (subjectName || specificComp || generalComp || compComp) {
          subjects.push({
            code: subjectCode ? String(subjectCode).trim() : undefined,
            name: subjectName ? String(subjectName).trim() : '',
            specificCompetences: specificComp ? String(specificComp).split(',').map(s => s.trim()).filter(s => s) : undefined,
            generalCompetences: generalComp ? String(generalComp).split(',').map(s => s.trim()).filter(s => s) : undefined,
            complementaryCompetences: compComp ? String(compComp).split(',').map(s => s.trim()).filter(s => s) : undefined,
          });
        }
      }
    }
  }
  return subjects;
}

// Main execution
async function main() {
  console.log('=== Extracting Teachers and Subjects ===\n');
  
  // Extract teacher profile
  console.log('Reading TEACHERS CONTACT.xlsx...');
  const teacherSheets = readExcel(TEACHERS_CONTACT_PATH);
  const teachers = extractTeacherProfile(teacherSheets);
  console.log(`Found ${teachers.length} teachers`);
  
  // Save teachers to JSON
  const teachersOutputPath = path.join(__dirname, '../../../extracted-teachers.json');
  fs.writeFileSync(teachersOutputPath, JSON.stringify(teachers, null, 2));
  console.log(`Saved teachers to: ${teachersOutputPath}\n`);
  
  // Display teachers
  if (teachers.length > 0) {
    console.log('Teachers found:');
    teachers.slice(0, 10).forEach((t, i) => {
      console.log(`${i + 1}. ${t.name}${t.phone ? ` - ${t.phone}` : ''}${t.subjects ? ` - Subjects: ${t.subjects.join(', ')}` : ''}`);
    });
    if (teachers.length > 10) console.log(`... and ${teachers.length - 10} more`);
  }
  
  // Extract subjects from timetables
  console.log('\nReading time table files...');
  const subjects = extractSubjectsFromTimetables(TIME_TABLE_DIR);
  console.log(`Found ${subjects.length} subject entries`);
  
  // Save subjects to JSON
  const subjectsOutputPath = path.join(__dirname, '../../../extracted-subjects.json');
  fs.writeFileSync(subjectsOutputPath, JSON.stringify(subjects, null, 2));
  console.log(`Saved subjects to: ${subjectsOutputPath}\n`);
  
  // Display subjects
  if (subjects.length > 0) {
    console.log('Subjects found:');
    subjects.slice(0, 15).forEach((s, i) => {
      console.log(`${i + 1}. ${s.name || '(no name)'}${s.code ? ` [${s.code}]` : ''}`);
      if (s.specificCompetences) console.log(`   Specific: ${s.specificCompetences.join(', ')}`);
      if (s.generalCompetences) console.log(`   General: ${s.generalCompetences.join(', ')}`);
      if (s.complementaryCompetences) console.log(`   Complementary: ${s.complementaryCompetences.join(', ')}`);
    });
    if (subjects.length > 15) console.log(`... and ${subjects.length - 15} more`);
  }
  
  console.log('\n=== Extraction Complete ===');
}

main().catch(console.error);
