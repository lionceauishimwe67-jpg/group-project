import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { query, run } from '../config/database';

async function importTeacherContacts() {
  try {
    console.log('Reading TEACHERS CONTACT.xlsx file...');
    
    const filePath = path.join(__dirname, '../../../TEACHERS CONTACT.xlsx');
    
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      process.exit(1);
    }
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`Found ${data.length} contacts in the file`);
    console.log('Sample data:', JSON.stringify(data[0], null, 2));
    
    let updated = 0;
    let created = 0;
    
    for (const row of data) {
      // Try to identify name and phone fields
      const rowData = row as any;
      const name = rowData['NAMES'] || rowData['Names'] || rowData['Name'] || rowData['name'] || rowData['Teacher'] || rowData['teacher'] || rowData['Full Name'] || rowData['full_name'];
      const phone = rowData['CONTACT'] || rowData['Contact'] || rowData['Phone'] || rowData['phone'] || rowData['Telephone'] || rowData['telephone'];
      const email = rowData['Email'] || rowData['email'] || rowData['E-mail'] || rowData['e_mail'];
      const school = rowData['School'] || rowData['school'];
      const subjects = rowData['Subjects'] || rowData['subjects'];
      
      if (!name || !phone) {
        console.log('Skipping row - missing name or phone:', row);
        continue;
      }
      
      console.log(`Processing: ${name} - ${phone}`);
      
      // Check if teacher exists by name
      const existing = await query<any[]>(
        'SELECT id, name FROM teachers WHERE name = ?',
        [name]
      );
      
      if (existing.length > 0) {
        // Update existing teacher
        await query(
          'UPDATE teachers SET phone = ?, email = ?, subjects = ? WHERE id = ?',
          [phone, email || null, subjects || null, existing[0].id]
        );
        console.log(`Updated: ${name}`);
        updated++;
      } else {
        // Create new teacher
        await query(
          'INSERT INTO teachers (name, phone, email, subjects, sms_notification_enabled) VALUES (?, ?, ?, ?, 1)',
          [name, phone, email || null, subjects || null]
        );
        console.log(`Created: ${name}`);
        created++;
      }
    }
    
    console.log(`\nImport complete!`);
    console.log(`Updated: ${updated} teachers`);
    console.log(`Created: ${created} teachers`);
    console.log(`Total: ${updated + created} teachers processed`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

importTeacherContacts();
