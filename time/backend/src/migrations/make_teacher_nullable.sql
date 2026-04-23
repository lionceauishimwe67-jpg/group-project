-- Make teacher_id nullable in timetable table
-- SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table

BEGIN TRANSACTION;

-- Create new timetable table with nullable teacher_id
CREATE TABLE timetable_new (
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
);

-- Copy data from old table
INSERT INTO timetable_new (id, class_id, subject_id, teacher_id, classroom_id, start_time, end_time, day_of_week, is_temporary, temporary_date, is_active, status, teacher_checked_in, created_at, updated_at)
SELECT id, class_id, subject_id, teacher_id, classroom_id, start_time, end_time, day_of_week, is_temporary, temporary_date, is_active, status, teacher_checked_in, created_at, updated_at
FROM timetable;

-- Drop old table
DROP TABLE timetable;

-- Rename new table
ALTER TABLE timetable_new RENAME TO timetable;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_timetable_class_id ON timetable(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_subject_id ON timetable(subject_id);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher_id ON timetable(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day_of_week ON timetable(day_of_week);

COMMIT;
