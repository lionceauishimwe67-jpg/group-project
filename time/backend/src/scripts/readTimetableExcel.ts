import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const excelFilePath = path.join(__dirname, '../../../time table/LYCEE TIME TABLE 5.xlsx');

console.log('Reading Excel file:', excelFilePath);

if (!fs.existsSync(excelFilePath)) {
  console.error('Excel file not found:', excelFilePath);
  process.exit(1);
}

const workbook = XLSX.readFile(excelFilePath);
console.log('Sheet names:', workbook.SheetNames);

// Read the first sheet
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Data preview (first 20 rows):');
console.log(JSON.stringify(data.slice(0, 20), null, 2));

// Save full data to a JSON file for analysis
const outputPath = path.join(__dirname, '../../../time table/timetable-data.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
console.log('Full data saved to:', outputPath);

process.exit(0);
