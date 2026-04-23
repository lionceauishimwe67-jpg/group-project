import * as fs from 'fs';
import * as path from 'path';

interface Schedule {
  time: string;
  day: string;
  subject: string;
  teacherId?: number;
}

interface TimetableData {
  file: string;
  sheet: string;
  classInfo: string;
  level: string;
  schedule: Schedule[];
}

const dataPath = path.join(__dirname, '../../../time table/parsed-timetables.json');
const data: TimetableData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Get unique time slots in order of appearance
const timeSlots = [...new Set(data.flatMap((d: TimetableData) => d.schedule.map((s: Schedule) => s.time)))];

console.log('Time slots in order:');
timeSlots.forEach((slot, index) => {
  console.log(`${index + 1}. ${slot}`);
});

process.exit(0);
