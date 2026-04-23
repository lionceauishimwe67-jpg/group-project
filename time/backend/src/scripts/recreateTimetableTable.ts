import { query } from '../config/database';

async function recreateTimetableTable() {
  console.log('Dropping timetable table...');
  try {
    await query('DROP TABLE IF EXISTS timetable');
    console.log('Table dropped');
  } catch (error: any) {
    console.error('Error dropping table:', error.message);
  }

  console.log('Creating timetable table with nullable teacher_id...');
  const createTableSQL = `
    CREATE TABLE timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      teacher_id INTEGER,
      classroom_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      is_temporary INTEGER DEFAULT 0,
      temporary_date TEXT,
      is_active INTEGER DEFAULT 1,
      status TEXT DEFAULT 'scheduled',
      teacher_checked_in INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
      FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
    )
  `;

  await query(createTableSQL);
  console.log('Table created');

  console.log('Creating indexes...');
  await query('CREATE INDEX IF NOT EXISTS idx_timetable_class_id ON timetable(class_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_timetable_subject_id ON timetable(subject_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_timetable_teacher_id ON timetable(teacher_id)');
  await query('CREATE INDEX IF NOT EXISTS idx_timetable_day_of_week ON timetable(day_of_week)');
  console.log('Indexes created');

  console.log('Done');
  process.exit(0);
}

recreateTimetableTable().catch(err => {
  console.error(err);
  process.exit(1);
});
