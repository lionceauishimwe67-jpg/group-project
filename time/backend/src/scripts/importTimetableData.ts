import { query } from '../config/database';
import * as fs from 'fs';
import * as path from 'path';

interface ParsedTimetable {
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

async function importTimetableData() {
  const dataPath = path.join(__dirname, '../../../time table/parsed-timetables.json');
  const data: ParsedTimetable[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log('Importing timetable data...');
  console.log(`Total entries to import: ${data.reduce((sum, d) => sum + d.schedule.length, 0)}`);

  // Get or create subjects
  const uniqueSubjects = [...new Set(data.flatMap(d => d.schedule.map(s => s.subject)))];
  console.log(`Unique subjects: ${uniqueSubjects.length}`);

  const subjectMap = new Map<string, number>();
  for (const subjectName of uniqueSubjects) {
    try {
      const result = await query<{ insertId: number }>(
        'INSERT OR IGNORE INTO subjects (name) VALUES (?)',
        [subjectName]
      );
      const id = result.insertId || (await query<{ id: number }[]>('SELECT id FROM subjects WHERE name = ?', [subjectName]))[0].id;
      subjectMap.set(subjectName, id);
    } catch (error: any) {
      console.error(`Error creating subject ${subjectName}:`, error.message);
    }
  }

  // Get or create teachers
  const uniqueTeacherIds = [...new Set(data.flatMap(d => d.schedule.map(s => s.teacherId).filter((id): id is number => id !== undefined)))];
  console.log(`Unique teacher IDs: ${uniqueTeacherIds.length}`);

  const teacherMap = new Map<number, number>();
  for (const teacherId of uniqueTeacherIds) {
    try {
      const result = await query<{ insertId: number }>(
        'INSERT OR IGNORE INTO teachers (name, email, phone) VALUES (?, ?, ?)',
        [`Teacher ${teacherId}`, `teacher${teacherId}@school.com`, `+250${teacherId.toString().padStart(9, '0')}`]
      );
      const id = result.insertId || (await query<{ id: number }[]>('SELECT id FROM teachers WHERE name = ?', [`Teacher ${teacherId}`]))[0].id;
      teacherMap.set(teacherId, id);
    } catch (error: any) {
      console.error(`Error creating teacher ${teacherId}:`, error.message);
    }
  }

  // Get or create classes
  const uniqueClasses = [...new Set(data.map(d => d.sheet))];
  console.log(`Unique classes: ${uniqueClasses.length}`);

  const classMap = new Map<string, number>();
  for (const className of uniqueClasses) {
    try {
      const level = data.find(d => d.sheet === className)?.level || 'Unknown';
      const result = await query<{ insertId: number }>(
        'INSERT OR IGNORE INTO classes (name, level) VALUES (?, ?)',
        [className, level]
      );
      const id = result.insertId || (await query<{ id: number }[]>('SELECT id FROM classes WHERE name = ?', [className]))[0].id;
      classMap.set(className, id);
    } catch (error: any) {
      console.error(`Error creating class ${className}:`, error.message);
    }
  }

  // Get or create classrooms (default to room names based on class)
  const classroomMap = new Map<string, number>();
  for (const className of uniqueClasses) {
    const classroomName = `${className} Room`;
    try {
      const result = await query<{ insertId: number }>(
        'INSERT OR IGNORE INTO classrooms (name, capacity) VALUES (?, ?)',
        [classroomName, 30]
      );
      const id = result.insertId || (await query<{ id: number }[]>('SELECT id FROM classrooms WHERE name = ?', [classroomName]))[0].id;
      classroomMap.set(className, id);
    } catch (error: any) {
      console.error(`Error creating classroom ${classroomName}:`, error.message);
    }
  }

  // Import timetable entries
  let importedCount = 0;
  const dayMap: Record<string, number> = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 0
  };

  for (const timetable of data) {
    const classId = classMap.get(timetable.sheet);
    const classroomId = classroomMap.get(timetable.sheet);

    if (!classId || !classroomId) {
      console.log(`Skipping ${timetable.sheet}: missing class or classroom`);
      continue;
    }

    for (const entry of timetable.schedule) {
      const subjectId = subjectMap.get(entry.subject);
      const teacherDbId = entry.teacherId ? teacherMap.get(entry.teacherId) : null;

      if (!subjectId) {
        console.log(`Skipping entry: missing subject ${entry.subject}`);
        continue;
      }

      const dayOfWeek = dayMap[entry.day];
      if (dayOfWeek === undefined) {
        console.log(`Skipping entry: invalid day ${entry.day}`);
        continue;
      }

      // Parse time range
      const [startTime, endTime] = entry.time.split('-').map(t => t.trim());

      try {
        await query(
          `INSERT OR REPLACE INTO timetable 
           (class_id, subject_id, teacher_id, classroom_id, start_time, end_time, day_of_week, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [classId, subjectId, teacherDbId, classroomId, startTime, endTime, dayOfWeek]
        );
        importedCount++;

        // Add teacher-subject relationship if teacher exists
        if (teacherDbId) {
          await query(
            'INSERT OR IGNORE INTO teacher_subjects (teacher_id, subject_id) VALUES (?, ?)',
            [teacherDbId, subjectId]
          );
        }
      } catch (error: any) {
        console.error(`Error importing entry:`, error.message);
      }
    }
  }

  console.log(`Import completed: ${importedCount} entries imported`);
  process.exit(0);
}

importTimetableData().catch(err => {
  console.error(err);
  process.exit(1);
});
