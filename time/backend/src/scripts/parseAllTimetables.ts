import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const timetableDir = path.join(__dirname, '../../../time table');

interface TimetableData {
  file: string;
  sheet: string;
  classInfo: string;
  level: string;
  schedule: {
    time: string;
    day: string;
    subject: string;
    teacherId?: number;
  }[];
}

const allData: TimetableData[] = [];

const files = fs.readdirSync(timetableDir).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));

console.log('Found files:', files);

for (const file of files) {
  const filePath = path.join(timetableDir, file);
  console.log(`\nProcessing: ${file}`);

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      // Extract class info and level
      let classInfo = '';
      let level = '';
      let headerRowIndex = -1;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row[1] && typeof row[1] === 'string' && row[1].includes('LEVEL')) {
          classInfo = row[1] || '';
          level = row[1]?.match(/LEVEL\s+[IVX]+/i)?.[0] || '';
        }
        if (row[0] === 'Time / period') {
          headerRowIndex = i;
          break;
        }
      }

      // Map Level V class names to abbreviations
      let mappedSheetName = sheetName;
      if (classInfo.includes('LEVEL V NETWORKING')) {
        mappedSheetName = 'L5NIT';
      } else if (classInfo.includes('LEVEL V SOFTWARE')) {
        mappedSheetName = 'L5SWD';
      } else if (classInfo.includes('LEVEL V FAD')) {
        mappedSheetName = 'L5FAD';
      }

      // Map FAD, SWD, and SOD sheets in Level 5 files to L5FAD, L5SWD
      if (file.includes('TIME TABLE 5') && sheetName === 'FAD') {
        mappedSheetName = 'L5FAD';
      } else if (file.includes('TIME TABLE 5') && sheetName === 'SWD') {
        mappedSheetName = 'L5SWD';
      } else if (file.includes('TIME TABLE 5') && sheetName === 'SOD') {
        mappedSheetName = 'L5SWD';
      }

      // Only process L5 (Level V) and S6 classes
      const isL5Class = classInfo.includes('LEVEL V') || mappedSheetName.startsWith('L5');
      const isS6Class = mappedSheetName.startsWith('S6') || sheetName.startsWith('S6');
      
      if (!isL5Class && !isS6Class) {
        console.log(`  Sheet ${sheetName}: Not L5 or S6 level, skipping`);
        continue;
      }

      if (headerRowIndex === -1) {
        console.log(`  Sheet ${sheetName}: No header row found, skipping`);
        continue;
      }

      const headerRow = data[headerRowIndex];
      const days = headerRow.slice(1).filter((d: any) => d); // Monday, Tuesday, etc.

      const schedule: TimetableData['schedule'] = [];

      // Parse schedule rows
      for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0]) continue;

        const time = row[0];
        if (!time || time.includes('BREAK') || time.includes('LUNCH') || time.includes('ASSEMBLY')) continue;

        for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
          const cell = row[dayIndex + 1];
          if (!cell || cell === 'TEST' || cell === 'DEBATE' || cell === 'SPORT' || cell === 'RELIGION' || cell === 'CPD') continue;

          // Parse subject and teacher ID (e.g., "CCMBO (19)")
          const match = cell.match(/(.+?)\s*\((\d+)\)/);
          const subject = match ? match[1].trim() : cell.toString().trim();
          const teacherId = match ? parseInt(match[2]) : undefined;

          schedule.push({
            time,
            day: days[dayIndex],
            subject,
            teacherId
          });
        }
      }

      allData.push({
        file,
        sheet: mappedSheetName,
        classInfo,
        level,
        schedule
      });

      console.log(`  Sheet ${sheetName} -> ${mappedSheetName}: ${schedule.length} entries extracted`);
    }
  } catch (error) {
    console.error(`  Error processing ${file}:`, error);
  }
}

// Save extracted data
const outputPath = path.join(__dirname, '../../../time table/parsed-timetables.json');
fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
console.log(`\nAll data saved to: ${outputPath}`);

// Print summary
console.log('\n=== SUMMARY ===');
console.log(`Total entries extracted: ${allData.reduce((sum, d) => sum + d.schedule.length, 0)}`);
console.log(`Unique subjects: ${[...new Set(allData.flatMap(d => d.schedule.map(s => s.subject)))].length}`);
console.log(`Unique teacher IDs: ${[...new Set(allData.flatMap(d => d.schedule.map(s => s.teacherId).filter(Boolean)))].length}`);

process.exit(0);
