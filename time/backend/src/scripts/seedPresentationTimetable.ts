import { query, run } from '../config/database';

const days = [1, 2, 3, 4, 5];

const classes = [
  { name: 'DEMO-L5NIT', level: 'L5' },
  { name: 'DEMO-L4SWD', level: 'L4' },
  { name: 'DEMO-S5ACC', level: 'S5' }
];

const teachers = [
  { name: 'Pascal Habimana', email: 'pascal.habimana@example.com', phone: '+250780000001' },
  { name: 'Alice Uwase', email: 'alice.uwase@example.com', phone: '+250780000002' },
  { name: 'Jean Mugisha', email: 'jean.mugisha@example.com', phone: '+250780000003' },
  { name: 'Claudine Mukamana', email: 'claudine.mukamana@example.com', phone: '+250780000004' },
  { name: 'Eric Niyonzima', email: 'eric.niyonzima@example.com', phone: '+250780000005' }
];

const subjects = [
  { name: 'Database Management', code: 'DBMS' },
  { name: 'Web Development', code: 'WEB' },
  { name: 'Networking', code: 'NET' },
  { name: 'Mathematics', code: 'MATH' },
  { name: 'Entrepreneurship', code: 'ENT' },
  { name: 'English Communication', code: 'ENG' }
];

const classrooms = [
  { name: 'Computer Lab 1', capacity: 30, location: 'ICT Block' },
  { name: 'Computer Lab 2', capacity: 30, location: 'ICT Block' },
  { name: 'Room A1', capacity: 40, location: 'Block A' },
  { name: 'Room B2', capacity: 40, location: 'Block B' }
];

const slots = [
  { start: '08:10', end: '09:00', subject: 0, teacher: 0, room: 0 },
  { start: '09:00', end: '09:50', subject: 1, teacher: 1, room: 0 },
  { start: '10:10', end: '11:00', subject: 2, teacher: 2, room: 1 },
  { start: '11:00', end: '11:50', subject: 3, teacher: 3, room: 2 },
  { start: '13:30', end: '14:20', subject: 4, teacher: 4, room: 3 },
  { start: '14:20', end: '15:10', subject: 5, teacher: 1, room: 2 }
];

const upsertClass = async (name: string, level: string) => {
  await run(`INSERT OR IGNORE INTO classes (name, level) VALUES (?, ?)`, [name, level]);
  const rows = await query<{ id: number }[]>(`SELECT id FROM classes WHERE name = ?`, [name]);
  return rows[0].id;
};

const upsertTeacher = async (teacher: typeof teachers[number]) => {
  await run(
    `INSERT OR IGNORE INTO teachers (name, email, phone, notification_enabled, notification_advance_minutes, sms_notification_enabled)
     VALUES (?, ?, ?, 1, 5, 1)`,
    [teacher.name, teacher.email, teacher.phone]
  );
  await run(
    `UPDATE teachers
     SET email = ?, phone = ?, notification_enabled = 1, notification_advance_minutes = 5, sms_notification_enabled = 1
     WHERE name = ?`,
    [teacher.email, teacher.phone, teacher.name]
  );
  const rows = await query<{ id: number }[]>(`SELECT id FROM teachers WHERE name = ?`, [teacher.name]);
  return rows[0].id;
};

const upsertSubject = async (subject: typeof subjects[number]) => {
  await run(`INSERT OR IGNORE INTO subjects (name, code) VALUES (?, ?)`, [subject.name, subject.code]);
  const rows = await query<{ id: number }[]>(`SELECT id FROM subjects WHERE name = ?`, [subject.name]);
  return rows[0].id;
};

const upsertClassroom = async (classroom: typeof classrooms[number]) => {
  await run(
    `INSERT OR IGNORE INTO classrooms (name, capacity, location) VALUES (?, ?, ?)`,
    [classroom.name, classroom.capacity, classroom.location]
  );
  const rows = await query<{ id: number }[]>(`SELECT id FROM classrooms WHERE name = ?`, [classroom.name]);
  return rows[0].id;
};

const seed = async () => {
  const classIds = [];
  for (const cls of classes) {
    classIds.push(await upsertClass(cls.name, cls.level));
  }

  const teacherIds = [];
  for (const teacher of teachers) {
    teacherIds.push(await upsertTeacher(teacher));
  }

  const subjectIds = [];
  for (const subject of subjects) {
    subjectIds.push(await upsertSubject(subject));
  }

  const classroomIds = [];
  for (const classroom of classrooms) {
    classroomIds.push(await upsertClassroom(classroom));
  }

  for (const classId of classIds) {
    await run(`DELETE FROM timetable WHERE class_id = ?`, [classId]);
  }

  let inserted = 0;
  for (const day of days) {
    for (let classIndex = 0; classIndex < classIds.length; classIndex++) {
      for (const slot of slots) {
        const shiftedSubject = (slot.subject + classIndex + day) % subjectIds.length;
        const shiftedTeacher = (slot.teacher + classIndex + day) % teacherIds.length;
        const shiftedRoom = (slot.room + classIndex) % classroomIds.length;

        await run(
          `INSERT INTO timetable
            (class_id, subject_id, teacher_id, classroom_id, day_of_week, start_time, end_time, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            classIds[classIndex],
            subjectIds[shiftedSubject],
            teacherIds[shiftedTeacher],
            classroomIds[shiftedRoom],
            day,
            slot.start,
            slot.end
          ]
        );
        inserted++;
      }
    }
  }

  console.log(`Presentation timetable ready: ${inserted} lessons inserted.`);
  console.log('Demo teacher emails use example.com; replace them with real teacher emails before live use.');
};

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed presentation timetable:', error);
    process.exit(1);
  });
