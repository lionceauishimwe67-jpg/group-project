const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

// Subject-hour requirements per class type (based on Rwandan curriculum standards)
const CURRICULUM = {
  'L3NIT': {
    subjects: [
      { name: 'Mathematics', hours: 4, availability: 'Morning' },
      { name: 'English', hours: 4, availability: 'Full Day' },
      { name: 'French', hours: 3, availability: 'Morning' },
      { name: 'Physics', hours: 3, availability: 'Morning' },
      { name: 'Chemistry', hours: 2, availability: 'Morning' },
      { name: 'Biology', hours: 2, availability: 'Morning' },
      { name: 'History', hours: 2, availability: 'Afternoon' },
      { name: 'Geography', hours: 2, availability: 'Afternoon' },
      { name: 'ICT', hours: 2, availability: 'Full Day' },
      { name: 'Networking', hours: 4, availability: 'Full Day' },
      { name: 'Kinyarwanda', hours: 2, availability: 'Full Day' },
      { name: 'Physical Education', hours: 2, availability: 'Afternoon' },
      { name: 'Religion', hours: 1, availability: 'Afternoon' },
      { name: 'Entrepreneurship', hours: 2, availability: 'Full Day' },
    ]
  },
  'L3SWD': {
    subjects: [
      { name: 'Mathematics', hours: 4, availability: 'Morning' },
      { name: 'English', hours: 4, availability: 'Full Day' },
      { name: 'French', hours: 3, availability: 'Morning' },
      { name: 'Physics', hours: 3, availability: 'Morning' },
      { name: 'Chemistry', hours: 2, availability: 'Morning' },
      { name: 'Biology', hours: 2, availability: 'Morning' },
      { name: 'History', hours: 2, availability: 'Afternoon' },
      { name: 'Geography', hours: 2, availability: 'Afternoon' },
      { name: 'ICT', hours: 2, availability: 'Full Day' },
      { name: 'Software Development', hours: 5, availability: 'Full Day' },
      { name: 'Kinyarwanda', hours: 2, availability: 'Full Day' },
      { name: 'Physical Education', hours: 2, availability: 'Afternoon' },
      { name: 'Religion', hours: 1, availability: 'Afternoon' },
      { name: 'Entrepreneurship', hours: 2, availability: 'Full Day' },
    ]
  },
  'L3FAD': {
    subjects: [
      { name: 'Mathematics', hours: 4, availability: 'Morning' },
      { name: 'English', hours: 4, availability: 'Full Day' },
      { name: 'French', hours: 3, availability: 'Morning' },
      { name: 'Physics', hours: 2, availability: 'Morning' },
      { name: 'Chemistry', hours: 2, availability: 'Morning' },
      { name: 'Biology', hours: 2, availability: 'Morning' },
      { name: 'History', hours: 2, availability: 'Afternoon' },
      { name: 'Geography', hours: 2, availability: 'Afternoon' },
      { name: 'ICT', hours: 2, availability: 'Full Day' },
      { name: 'Fashion Design', hours: 5, availability: 'Full Day' },
      { name: 'Kinyarwanda', hours: 2, availability: 'Full Day' },
      { name: 'Physical Education', hours: 2, availability: 'Afternoon' },
      { name: 'Religion', hours: 1, availability: 'Afternoon' },
      { name: 'Entrepreneurship', hours: 2, availability: 'Full Day' },
    ]
  },
  'L4NIT': {
    subjects: [
      { name: 'Mathematics', hours: 4, availability: 'Morning' },
      { name: 'English', hours: 4, availability: 'Full Day' },
      { name: 'French', hours: 3, availability: 'Morning' },
      { name: 'Physics', hours: 3, availability: 'Morning' },
      { name: 'Chemistry', hours: 2, availability: 'Morning' },
      { name: 'Biology', hours: 2, availability: 'Morning' },
      { name: 'History', hours: 2, availability: 'Afternoon' },
      { name: 'Geography', hours: 2, availability: 'Afternoon' },
      { name: 'ICT', hours: 2, availability: 'Full Day' },
      { name: 'Networking', hours: 5, availability: 'Full Day' },
      { name: 'Kinyarwanda', hours: 2, availability: 'Full Day' },
      { name: 'Physical Education', hours: 2, availability: 'Afternoon' },
      { name: 'Religion', hours: 1, availability: 'Afternoon' },
      { name: 'Entrepreneurship', hours: 2, availability: 'Full Day' },
    ]
  },
  'L4SWD': {
    subjects: [
      { name: 'Mathematics', hours: 4, availability: 'Morning' },
      { name: 'English', hours: 4, availability: 'Full Day' },
      { name: 'French', hours: 3, availability: 'Morning' },
      { name: 'Physics', hours: 3, availability: 'Morning' },
      { name: 'Chemistry', hours: 2, availability: 'Morning' },
      { name: 'Biology', hours: 2, availability: 'Morning' },
      { name: 'History', hours: 2, availability: 'Afternoon' },
      { name: 'Geography', hours: 2, availability: 'Afternoon' },
      { name: 'ICT', hours: 2, availability: 'Full Day' },
      { name: 'Software Development', hours: 5, availability: 'Full Day' },
      { name: 'Kinyarwanda', hours: 2, availability: 'Full Day' },
      { name: 'Physical Education', hours: 2, availability: 'Afternoon' },
      { name: 'Religion', hours: 1, availability: 'Afternoon' },
      { name: 'Entrepreneurship', hours: 2, availability: 'Full Day' },
    ]
  },
  'L4FAD': {
    subjects: [
      { name: 'Mathematics', hours: 4, availability: 'Morning' },
      { name: 'English', hours: 4, availability: 'Full Day' },
      { name: 'French', hours: 3, availability: 'Morning' },
      { name: 'Physics', hours: 2, availability: 'Morning' },
      { name: 'Chemistry', hours: 2, availability: 'Morning' },
      { name: 'Biology', hours: 2, availability: 'Morning' },
      { name: 'History', hours: 2, availability: 'Afternoon' },
      { name: 'Geography', hours: 2, availability: 'Afternoon' },
      { name: 'ICT', hours: 2, availability: 'Full Day' },
      { name: 'Fashion Design', hours: 5, availability: 'Full Day' },
      { name: 'Kinyarwanda', hours: 2, availability: 'Full Day' },
      { name: 'Physical Education', hours: 2, availability: 'Afternoon' },
      { name: 'Religion', hours: 1, availability: 'Afternoon' },
      { name: 'Entrepreneurship', hours: 2, availability: 'Full Day' },
    ]
  },
  'L5NIT': {
    subjects: [
      { name: 'Mathematics', hours: 4, availability: 'Morning' },
      { name: 'English', hours: 4, availability: 'Full Day' },
      { name: 'French', hours: 3, availability: 'Morning' },
      { name: 'Physics', hours: 3, availability: 'Morning' },
      { name: 'Chemistry', hours: 2, availability: 'Morning' },
      { name: 'Biology', hours: 2, availability: 'Morning' },
      { name: 'History', hours: 2, availability: 'Afternoon' },
      { name: 'Geography', hours: 2, availability: 'Afternoon' },
      { name: 'ICT', hours: 2, availability: 'Full Day' },
      { name: 'Networking', hours: 5, availability: 'Full Day' },
      { name: 'Kinyarwanda', hours: 2, availability: 'Full Day' },
      { name: 'Physical Education', hours: 2, availability: 'Afternoon' },
      { name: 'Religion', hours: 1, availability: 'Afternoon' },
      { name: 'Entrepreneurship', hours: 2, availability: 'Full Day' },
    ]
  },
  'L5SWD': {
    subjects: [
      { name: 'Mathematics', hours: 4, availability: 'Morning' },
      { name: 'English', hours: 4, availability: 'Full Day' },
      { name: 'French', hours: 3, availability: 'Morning' },
      { name: 'Physics', hours: 3, availability: 'Morning' },
      { name: 'Chemistry', hours: 2, availability: 'Morning' },
      { name: 'Biology', hours: 2, availability: 'Morning' },
      { name: 'History', hours: 2, availability: 'Afternoon' },
      { name: 'Geography', hours: 2, availability: 'Afternoon' },
      { name: 'ICT', hours: 2, availability: 'Full Day' },
      { name: 'Software Development', hours: 5, availability: 'Full Day' },
      { name: 'Kinyarwanda', hours: 2, availability: 'Full Day' },
      { name: 'Physical Education', hours: 2, availability: 'Afternoon' },
      { name: 'Religion', hours: 1, availability: 'Afternoon' },
      { name: 'Entrepreneurship', hours: 2, availability: 'Full Day' },
    ]
  },
  'L5FAD': {
    subjects: [
      { name: 'Mathematics', hours: 4, availability: 'Morning' },
      { name: 'English', hours: 4, availability: 'Full Day' },
      { name: 'French', hours: 3, availability: 'Morning' },
      { name: 'Physics', hours: 2, availability: 'Morning' },
      { name: 'Chemistry', hours: 2, availability: 'Morning' },
      { name: 'Biology', hours: 2, availability: 'Morning' },
      { name: 'History', hours: 2, availability: 'Afternoon' },
      { name: 'Geography', hours: 2, availability: 'Afternoon' },
      { name: 'ICT', hours: 2, availability: 'Full Day' },
      { name: 'Fashion Design', hours: 5, availability: 'Full Day' },
      { name: 'Kinyarwanda', hours: 2, availability: 'Full Day' },
      { name: 'Physical Education', hours: 2, availability: 'Afternoon' },
      { name: 'Religion', hours: 1, availability: 'Afternoon' },
      { name: 'Entrepreneurship', hours: 2, availability: 'Full Day' },
    ]
  },
  'L5CSA': {
    subjects: [
      { name: 'Mathematics', hours: 4, availability: 'Morning' },
      { name: 'English', hours: 4, availability: 'Full Day' },
      { name: 'French', hours: 3, availability: 'Morning' },
      { name: 'Physics', hours: 3, availability: 'Morning' },
      { name: 'Chemistry', hours: 2, availability: 'Morning' },
      { name: 'Biology', hours: 2, availability: 'Morning' },
      { name: 'History', hours: 2, availability: 'Afternoon' },
      { name: 'Geography', hours: 2, availability: 'Afternoon' },
      { name: 'ICT', hours: 2, availability: 'Full Day' },
      { name: 'Computer Science', hours: 5, availability: 'Full Day' },
      { name: 'Kinyarwanda', hours: 2, availability: 'Full Day' },
      { name: 'Physical Education', hours: 2, availability: 'Afternoon' },
      { name: 'Religion', hours: 1, availability: 'Afternoon' },
      { name: 'Entrepreneurship', hours: 2, availability: 'Full Day' },
    ]
  }
};

const TIME_SLOTS = [
  '08:00-09:00',
  '09:00-10:00',
  '10:00-10:30',
  '10:30-11:30',
  '11:30-12:30',
  '12:30-13:30',
  '13:30-14:30',
  '14:30-15:30',
  '15:30-16:00',
  '16:00-17:00'
];

const RULES = [
  'A teacher cannot teach two classes at the same time',
  'Subject hours must match weekly requirements',
  'Avoid repeating the same subject more than 2 times in one day',
  'Teachers must follow availability constraints',
  'Every class must have a balanced schedule',
  'Core subjects (Math, English, Physics) should be in morning slots',
  'Practical subjects (Fashion Design, Software Dev, Networking) need double periods',
  'Break times must be respected: 10:00-10:30 short break, 12:30-13:30 lunch'
];

(async () => {
  const db = await open({ filename: 'database.sqlite', driver: sqlite3.Database });
  
  const classes = await db.all(`SELECT id, name, level FROM classes WHERE name LIKE 'L3%' OR name LIKE 'L4%' OR name LIKE 'L5%' ORDER BY name`);
  
  const teachers = await db.all(`SELECT id, name FROM teachers ORDER BY name`);
  
  // Build teacher lookup by subject
  const teacherBySubject = {};
  const mappings = await db.all(`
    SELECT t.name as teacher_name, s.name as subject_name
    FROM teacher_subjects ts
    JOIN teachers t ON ts.teacher_id = t.id
    JOIN subjects s ON ts.subject_id = s.id
  `);
  mappings.forEach(m => {
    teacherBySubject[m.subject_name.toLowerCase()] = m.teacher_name;
  });
  
  // Fallback teacher assignment for common subjects
  const fallbackTeachers = {
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
    'computer science': 'ERIC Niyonzima',
  };
  
  const outputDir = path.join(__dirname, '..', 'timetable-templates');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate template for each class
  for (const cls of classes) {
    const curriculum = CURRICULUM[cls.name];
    if (!curriculum) {
      console.log(`⚠️  No curriculum defined for ${cls.name}, skipping`);
      continue;
    }
    
    const subjects = curriculum.subjects.map(sub => {
      // Find teacher: first from DB mapping, then from fallback
      const key = sub.name.toLowerCase();
      const teacher = teacherBySubject[key] || fallbackTeachers[key] || 'Unassigned';
      return {
        name: sub.name,
        teacher: teacher,
        hours_per_week: sub.hours,
        availability: sub.availability
      };
    });
    
    const template = {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      classes: [{
        id: cls.id,
        name: cls.name,
        level: cls.level || cls.name.substring(0, 2),
        students: 40
      }],
      subjects: subjects,
      rules: RULES,
      time_slots: TIME_SLOTS,
      classId: cls.id
    };
    
    const fileName = `${cls.name}_timetable_template.json`;
    const filePath = path.join(outputDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(template, null, 2));
    console.log(`✅ Created: ${fileName} (${subjects.length} subjects, ${cls.id})`);
  }
  
  // Also create a combined multi-class template
  const multiClassTemplate = {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    classes: classes.filter(c => CURRICULUM[c.name]).map(c => ({
      id: c.id,
      name: c.name,
      level: c.level || c.name.substring(0, 2),
      students: 40
    })),
    subjects: [],
    rules: RULES,
    time_slots: TIME_SLOTS
  };
  
  // Collect all unique subjects across all classes
  const allSubjects = new Map();
  for (const cls of classes) {
    const curriculum = CURRICULUM[cls.name];
    if (!curriculum) continue;
    for (const sub of curriculum.subjects) {
      const key = sub.name.toLowerCase();
      if (!allSubjects.has(key)) {
        const teacher = teacherBySubject[key] || fallbackTeachers[key] || 'Unassigned';
        allSubjects.set(key, {
          name: sub.name,
          teacher: teacher,
          hours_per_week: sub.hours,
          availability: sub.availability
        });
      }
    }
  }
  multiClassTemplate.subjects = Array.from(allSubjects.values());
  
  const multiPath = path.join(outputDir, 'all_classes_combined_template.json');
  fs.writeFileSync(multiPath, JSON.stringify(multiClassTemplate, null, 2));
  console.log(`\n✅ Created: all_classes_combined_template.json (${allSubjects.size} subjects, ${classes.length} classes)`);
  
  await db.close();
  console.log('\n🎉 All templates generated successfully!');
})();
